/**
 * ComicController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { constants } from "../constants/constants";
import { AppError } from "../custom/customClass";
import { mutipleUpload, uploadImage } from "../imagekit";
import tryCatch from "../utils/tryCatch";
import { v4 as uuidV4 } from 'uuid'
import { ObjectId } from 'mongodb'
import { helper } from "../utils/helper";

declare const Comic: any
declare const ComicCategory: any
declare const Category: any
declare const sails: any

module.exports = {

    get: tryCatch(async (req, res) => {
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

    find: tryCatch(async (req, res) => {
        const { skip = 0, limit = 20 } = req.body

        const findOption = { skip, limit }

        const [total, listComic] =
            await Promise.all([
                Comic.count({}),
                Comic.find({
                    ...findOption
                }).populate('author')
            ])

        for (let comic of listComic) {
            comic.createdAt = helper.convertToStringDate(comic.createdAt)
            comic.updatedAt = helper.convertToStringDate(comic.updatedAt)
            comic.publishedAt = helper.convertToStringDate(comic.publishedAt, constants.DATE_FORMAT)
            comic.author = comic.author?.name
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

        const db = sails.getDatastore().manager
        // const categoriesObjectId = categories.map(item => ObjectId(item))
        Promise.all([
            Comic.addToCollection(createdComic.id, 'categories', [...new Set(categories)]),
            db.collection('author').updateOne(
                { _id: ObjectId(author), },
                { $inc: { numOfComic: 1 } }
            ),
            // db.collection('category').updateMany(
            //     { _id: { $in: categoriesObjectId } },
            //     { $inc: { numOfComic: 1 } }
            // )
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
                const db = sails.getDatastore().manager
                return Promise.all([
                    db.collection('author').updateOne(
                        { _id: ObjectId(updatedComic.author), },
                        { $inc: { numOfComic: 1 } }
                    ),
                    db.collection('author').updateOne(
                        { _id: ObjectId(checkComic.author), },
                        { $inc: { numOfComic: -1 } }
                    ),
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

    detail: tryCatch(async (req, res) => {
        const { id, requestType } = req.body

        let comic: any
        if (requestType == 'update') {
            const comicDetailPromise = Comic.findOne({ id })
            const comicCategoriesPromise = ComicCategory.find({
                where: { comic: id },
                select: ['category']
            })
            const [comicDetail, categories] = await Promise.all([comicDetailPromise, comicCategoriesPromise])

            comic = {
                ...comicDetail,
                categories: categories?.map((item: any) => item?.category)
            }
        } else {
            comic = await Comic.findOne({ id })
                .populate('author')
                .populate('categories')
        }

        comic.createdAt = helper.convertToStringDate(comic.createdAt)
        comic.updatedAt = helper.convertToStringDate(comic.updatedAt)
        comic.publishedAt = helper.convertToStringDate(comic.publishedAt, constants.DATE_FORMAT)

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

        const newestComics = await Comic.find({}).sort('createdAt desc').limit(limit)

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

