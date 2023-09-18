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
import moment from "moment";
import { helper } from "../utils/helper";

declare const Comic: any
declare const Author: any

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

        const total = await Comic.count({})
        const listComic = await Comic.find({
            ...findOption
        })
        for (let comic of listComic) {
            comic.createdAt = helper.convertToStringDate(comic.createdAt)
            comic.updatedAt = helper.convertToStringDate(comic.updatedAt)
            comic.publishedAt = helper.convertToStringDate(comic.publishedAt)
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
        // name, description, categories, author, image, isHot
        const { image, name, description, author, publishedAt, status } = req.body
        if (!image || !name || !description || !author || !publishedAt)
            throw new AppError(400, 'Bad Request', 400)

        const uId = uuidV4()
        const { name: uploadedPath } = await uploadImage(image, `${constants.IMAGE_FOLDER.COMIC}/${uId}/avatar`, 'avatar')

        const createdComic = await Comic.create({
            name,
            description,
            author,
            image: `${constants.IMAGE_FOLDER.COMIC}/${uId}/avatar/${uploadedPath}`,
            uId,
            publishedAt: helper.convertToTimeStamp(publishedAt),
            status
        }).fetch()
        if (!createdComic)
            throw new AppError(400, 'Không thể khởi tạo Comic vui lòng thử lại.', 400)

        const db = Author.getDatastore().manager
        await db.collection('author').updateOne(
            { _id: ObjectId(author), },
            {
                $inc: { numOfComic: 1 }
            }
        )

        return res.status(200).json({
            err: 200,
            message: 'Thêm thành công',
        })
    }),

    edit: tryCatch(async (req, res) => {
        const { name, description, categories, author, image, isHot } = req.body

        const createdComic = await Comic.create({
            ...req.body
        }).fetch()

        if (!createdComic)
            throw new AppError(400, 'Không thể khởi tạo Comic vui lòng thử lại.', 400)

        return res.status(200).json({
            err: 200,
            message: 'Cập nhật thành công',
        })
    }),

    detail: tryCatch(async (req, res) => {

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

