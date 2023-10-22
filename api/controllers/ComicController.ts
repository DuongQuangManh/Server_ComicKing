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
declare const InteractComic: any
declare const User: any

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

        return res.status(200).json({ err: 200, message: 'Success', data: listComic, total, ...findOption })
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
            name, description, author, image: url, uId, status,
            publishedAt: helper.convertToTimeStamp(publishedAt),
        }).fetch()
        if (!createdComic)
            throw new AppError(400, 'Không thể khởi tạo Comic vui lòng thử lại.', 400)

        Promise.all([
            Comic.addToCollection(createdComic.id, 'categories', [...new Set(categories)]),
            Author.updateOne({ id: author }).set({ updatedComicAt: Date.now() }),
            handleIncNumPromise(author, 'author', 1, 'numOfComic'),
            handleIncNumPromise(categories, 'category', 1, 'numOfComic')
        ])

        return res.status(200).json({ err: 200, message: 'Thêm thành công', })
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
        const updateComicPromise = Comic.updateOne({ id }).set({
            name, description, author, status, image: url ?? checkComic.image,
            publishedAt: helper.convertToTimeStamp(publishedAt),
        })
        const getBeforeCategory = ComicCategory.find({ where: { comic: id }, select: ['category'] })
        const [beforeCategoryObj, updatedComic] = await Promise.all([getBeforeCategory, updateComicPromise])
        if (!updatedComic)
            throw new AppError(400, 'Không cập nhật Comic vui lòng thử lại.', 400)

        if (beforeCategoryObj) {
            // advoid duplicate category id
            const beforeCategorySet = new Set(beforeCategoryObj.map((item: any) => item.category) as string[])
            const updateCategorySet = new Set(categories)
            // filter categories need remove or add
            const categoriesNeedRemove = [...beforeCategorySet].filter((item) => !updateCategorySet.has(item))
            const categoriesNeedAdd = [...updateCategorySet].filter((item) => !beforeCategorySet.has(item))

            const handleAddCategoriesPromise = categoriesNeedAdd.length > 0 ? (Promise.all([
                Comic.addToCollection(updatedComic.id, 'categories', categoriesNeedAdd),
                handleIncNumPromise(categoriesNeedAdd, 'category', 1, 'numOfComic')
            ])) : null
            const handleRemoveCategoriesPromise = categoriesNeedRemove.length > 0 ? (Promise.all([
                Comic.removeFromCollection(updatedComic.id, 'categories', categoriesNeedRemove),
                handleIncNumPromise(categoriesNeedRemove, 'category', -1, 'numOfComic')
            ])) : null
            // const comicAddCategoriesPromise = Comic.addToCollection(updatedComic.id, 'categories', categoriesNeedAdd)
            // const comicRemoveCategoriesPromise = Comic.removeFromCollection(updatedComic.id, 'categories', categoriesNeedRemove)
            const updateNumComicOfAuthorPromise = () => {
                if (updatedComic.author != checkComic.author) {
                    return Promise.all([
                        handleIncNumPromise(updatedComic.author, 'author', 1, 'numOfComic'),
                        handleIncNumPromise(checkComic.author, 'author', -1, 'numOfComic')
                    ])
                }
            }
            Promise.all([
                handleAddCategoriesPromise, handleRemoveCategoriesPromise, updateNumComicOfAuthorPromise
            ])
        }

        return res.status(200).json({ err: 200, message: 'Cập nhật thành công', })
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
        const { comicId, userId } = req.body
        if (!comicId) throw new AppError(400, 'Bad Request', 400)

        const comicDetailPromise = Comic.findOne({
            where: { id: comicId, status: { '!=': constants.COMMON_STATUS.ACTIVE } }
        }).populate('author')
        const getComicChaptersPromise = Chapter.find({
            where: { comic: comicId, status: constants.COMMON_STATUS.ACTIVE },
            select: ['updatedAt', 'numOfView', 'numOfComment', 'numOfLike', 'index']
        }).sort('index asc')
        const getComicCategoriesPromise = ComicCategory.find({ comic: comicId }).populate('category')
        let getInteractComicPromise = null
        let getUserPromise = null
        if (userId) {
            getInteractComicPromise = InteractComic.findOne({ user: userId, comic: comicId })
            getUserPromise = User.findOne({ where: { id: userId }, select: ['authorFollowing', 'comicFollowing'] })
        }

        const [comic, chapters, categories, interactComic, checkUser] = await Promise.all([
            comicDetailPromise, getComicChaptersPromise, getComicCategoriesPromise,
            getInteractComicPromise, getUserPromise
        ])
        if (!comic)
            throw new AppError(400, 'Comic không tồn tại vui lòng thử lại hoặc thử ID khác.', 400)

        let { readedChapters, readingChapter } = interactComic ?? {}
        const readedChaptersSet = new Set(readedChapters ?? [])
        comic.chapters = chapters?.map((chapter: any) => {
            chapter.isRead = readedChaptersSet.has(chapter.id)
            chapter.updatedAt = helper.convertToStringDate(chapter.updatedAt, constants.DATE_FORMAT)
            return chapter
        })
        comic.categories = categories?.map((val: any) => ({
            id: val?.category?.id,
            title: val?.category?.title,
        }))
        // check following author + comic
        if (checkUser && comic.author) {
            if (checkUser.authorFollwing?.includes(comic.author.id)) {
                comic.author.isFollwing = true
            }
            if (checkUser.comicFollowing?.includes(comic.id)) {
                comic.isFollowing = true
            }
        }

        comic.readingChapter = readingChapter ?? 0
        comic.updatedChapterAt = helper.convertToStringDate(comic.updatedChapterAt, constants.DATE_FORMAT)
        comic.publishedAt = helper.convertToStringDate(comic.publishedAt, constants.DATE_FORMAT)
        helper.deleteFields(comic, 'createdAt', 'uId', 'status', 'updatedAt')

        return res.status(200).json({ err: 200, message: 'Success', data: comic })
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

