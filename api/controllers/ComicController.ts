/**
 * ComicController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { constants } from "../constants/constants";
import { AppError } from "../custom/customClass";
import { uploadImage } from "../imagekit";
import tryCatch from "../utils/tryCatch";
import { v4 as uuidV4 } from 'uuid'
import { helper } from "../utils/helper";
import { handleIncNumPromise } from "../services";

declare const Comic: any
declare const ComicCategory: any
declare const Chapter: any
declare const Author: any
declare const Category: any

module.exports = {

    adminFind: tryCatch(async (req, res) => {
        const { skip = 0, limit = 20 } = req.body

        const findOption = { skip, limit }

        const [total, listComic] =
            await Promise.all([
                Comic.count({}),
                Comic.find({
                    ...findOption,
                    select: [
                        'name', 'createdAt', 'publishedAt', 'updatedChapterAt', 'publishedAt',
                        'numOfChapter', 'numOfFollow', 'numOfView', 'star', 'numOfLike', 'status',
                    ]
                }).sort('createdAt desc')
            ])

        for (let comic of listComic) {
            comic.createdAt = helper.convertToStringDate(comic.createdAt)
            comic.updatedChapterAt = helper.convertToStringDate(comic.updatedChapterAt, constants.DATE_FORMAT)
            comic.publishedAt = helper.convertToStringDate(comic.publishedAt, constants.DATE_FORMAT)
        }

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: listComic,
            total,
            ...findOption
        })
    }),

    add: tryCatch(async (req, res) => {
        const { image, name, description, author, publishedAt, status, categories } = req.body
        if (!image || !name || !description || !author || !publishedAt || !Array.isArray(categories))
            throw new AppError(400, 'Bad Request', 400)
        if (categories.length > 10)
            throw new AppError(400, 'Vui lòng giảm bớt thể loại (giới hạn 10).', 400)

        const uId = uuidV4()
        const { url } = await uploadImage(image, `${constants.IMAGE_FOLDER.COMIC}/${uId}/avatar`, 'avatar')

        const createdComic = await Comic.create({
            name,
            description,
            author,
            image: url,
            uId,
            publishedAt: helper.convertToTimeStamp(publishedAt),
            status,
        }).fetch()
        if (!createdComic)
            throw new AppError(400, 'Không thể khởi tạo Comic vui lòng thử lại.', 400)

        Promise.all([
            Comic.addToCollection(createdComic.id, 'categories', [...new Set(categories)]),
            handleIncNumPromise(author, 'author', 1, 'numOfComic')
        ])

        return res.status(200).json({
            err: 200,
            message: 'Thêm thành công',
        })
    }),

    edit: tryCatch(async (req, res) => {
        const { id, image, name, description, author, publishedAt, status, categories } = req.body
        if (!name || !description || !author || !publishedAt || !Array.isArray(categories))
            throw new AppError(400, 'Bad Request', 400)
        if (categories.length > 10)
            throw new AppError(400, 'Vui lòng giảm bớt thể loại (giới hạn 10).', 400)

        const checkComic = await Comic.findOne({ id })
        if (!checkComic)
            throw new AppError(400, 'Truyện không tồn tại vui lòng thử lại.', 400)

        if (image && checkComic.image != image) {
            var { url } = await uploadImage(image, `${constants.IMAGE_FOLDER.COMIC}/${checkComic.uId}`, 'avatar')
        }

        const updatedComic = await Comic.updateOne({ id }).set({
            name,
            description,
            author,
            publishedAt: helper.convertToTimeStamp(publishedAt),
            status,
            image: url ?? checkComic.image,
        })
        if (!updatedComic)
            throw new AppError(400, 'Không cập nhật Comic vui lòng thử lại.', 400)

        // get comic categories before
        const beforeCategoryObj = await ComicCategory.find({
            where: { comic: id },
            select: ['category']
        })
        // advoid duplicate category id
        const beforeCategorySet = new Set(beforeCategoryObj.map((item: any) => item.category))
        const updateCategorySet = new Set(categories)
        // filter categories need remove or add
        const categoriesNeedRemove = [...beforeCategorySet].filter((item) => !updateCategorySet.has(item))
        const categoriesNeedAdd = [...updateCategorySet].filter((item) => !beforeCategorySet.has(item))

        const comicAddCategoriesPromise = Comic.addToCollection(updatedComic.id, 'categories', categoriesNeedAdd)
        const comicRemoveCategoriesPromise = Comic.removeFromCollection(updatedComic.id, 'categories', categoriesNeedRemove)
        const updateNumComicOfAuthorPromise = () => {
            if (updatedComic.author != checkComic.author) {
                return Promise.all([
                    handleIncNumPromise(updatedComic.author, 'author', 1, 'numOfComic'),
                    handleIncNumPromise(checkComic.author, 'author', -1, 'numOfComic')
                ])
            }
        }
        Promise.all([
            comicAddCategoriesPromise,
            comicRemoveCategoriesPromise,
            updateNumComicOfAuthorPromise
        ])

        return res.status(200).json({
            err: 200,
            message: 'Cập nhật thành công',
        })
    }),

    adminDetail: tryCatch(async (req, res) => {
        const { id, requestType } = req.body

        let comic: any
        const getComicPromise = Comic.findOne({ id })
        const getListComicCategory = ComicCategory.find({
            where: { comic: id },
            select: ['category']
        })
        const [comicDetail, listComicCategory] = await Promise.all([getComicPromise, getListComicCategory])
        if (requestType == 'update') {
            comic = {
                ...comicDetail,
                categories: listComicCategory?.map((item: any) => item.category)
            }
        } else {
            const listCategoryId = listComicCategory?.map((item: any) => item.category)
            const getAuthorPromise = Author.findOne({ id: comicDetail.author })
            const getListCategoryPromise = Category.find({
                where: { id: { 'in': listCategoryId } },
                select: ['title']
            })
            const [author, listCategory] = await Promise.all([getAuthorPromise, getListCategoryPromise])
            comic = {
                ...comicDetail,
                categories: listCategory,
                author
            }
        }
        if (!comic)
            throw new AppError(400, 'Comic không tồn tại', 400)

        comic.createdAt = helper.convertToStringDate(comic.createdAt)
        comic.updatedAt = helper.convertToStringDate(comic.updatedAt)
        comic.publishedAt = helper.convertToStringDate(comic.publishedAt, constants.DATE_FORMAT)

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: comic
        })
    }),

    clientFind: tryCatch(async (req, res) => {
        const { skip = 0, limit = 20 } = req.body

        const findOption = { skip, limit }

        const listComic = await Comic.find({
            ...findOption
        })

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: listComic
        })
    }),

    clientDetail: tryCatch(async (req, res) => {
        const { id } = req.body
        if (!id)
            throw new AppError(400, 'ID không được bỏ trống.', 400)

        const comicDetailPromise = Comic.findOne({
            where: {
                id,
                status: { '!=': constants.COMMON_STATUS.ACTIVE }
            }
        }).populate('author')
        const getComicChaptersPromise = Chapter.find({
            where: {
                comic: id,
                status: constants.COMMON_STATUS.ACTIVE
            },
            select: ['updatedAt', 'numOfView', 'numOfComment', 'numOfLike']
        }).sort('index asc')
        const getComicCategoriesPromise = ComicCategory.find({ comic: id }).populate('category')

        const [comic, chapters, categories] = await Promise.all([
            comicDetailPromise,
            getComicChaptersPromise,
            getComicCategoriesPromise
        ])
        if (!comic)
            throw new AppError(400, 'Comic không tồn tại vui lòng thử lại hoặc thử ID khác.', 400)

        comic.categories = categories?.map((val: any) => ({
            id: val?.category?.id,
            title: val?.category?.title,
        }))
        comic.author = {
            id: comic.author?.id,
            name: comic.author?.name
        }
        comic.updatedAt = helper.convertToStringDate(comic.updatedAt, constants.DATE_FORMAT)
        comic.publishedAt = helper.convertToStringDate(comic.publishedAt, constants.DATE_FORMAT)
        comic.chapters = chapters?.map((chapter: any) => {
            chapter.updatedAt = helper.convertToStringDate(chapter.updatedAt, constants.DATE_FORMAT)
            return chapter
        })
        helper.deleteFields(comic, 'createdAt', 'uId', 'status')

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: comic
        })
    }),

    getHomeComics: tryCatch(async (req, res) => {

    }),

    getDoneComics: tryCatch(async (req, res) => {
        let limit = 6

        const doneComics = await Comic.find({
            where: {
                status: constants.COMIC_STATUS.DONE
            },
            limit
        })

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: {
                title: 'Hoàn thành',
                canMore: true,
                listComic: doneComics
            }
        })
    }),

    getSliderComics: tryCatch(async (req, res) => {
        let limit = 6

        const sliderComics = await Comic.find({
            limit
        })

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: {
                title: '',
                canMore: false,
                listComic: sliderComics
            }
        })
    }),

    getNewestComics: tryCatch(async (req, res) => {
        let limit = 6

        const newestComics = await Comic.find({}).sort('updatedAt desc').limit(limit)

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: {
                title: 'Mới nhất',
                canMore: true,
                listComic: newestComics
            }
        })
    }),

    getProposeComics: tryCatch(async (req, res) => {
        let limit = 6

        const proposeComics = await Comic.find({
            limit,
            skip: 6
        })

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: {
                title: 'Đề xuất',
                canMore: false,
                listComic: proposeComics
            }
        })
    })
};

