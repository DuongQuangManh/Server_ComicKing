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

declare const Comic: any
declare const Author: any

module.exports = {

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

    adminFind: tryCatch(async (req, res) => {
        const { skip = 0, limit = 20 } = req.body

        const findOption = { skip, limit }

        if (skip == 0) {
            var numRecords = await Comic.count({})
        }

        const listComic = await Comic.find({
            ...findOption
        })

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: {
                numRecords,
                listComic,
                ...findOption
            }
        })
    }),

    add: tryCatch(async (req, res) => {
        // name, description, categories, author, image, isHot
        const { image, ...body } = req.body

        const uId = uuidV4()
        const { name } = await uploadImage(image, `${constants.IMAGE_FOLDER.COMIC}/${uId}/avatar`, 'avatar')

        const createdComic = await Comic.create({
            ...body,
            image: `${constants.IMAGE_FOLDER.COMIC}/${uId}/avatar/${name}`,
            uId,
        }).fetch()
        if (!createdComic)
            throw new AppError(400, 'Không thể khởi tạo Comic vui lòng thử lại.', 400)

        const db = Author.getDatastore().manager
        await db.collection('author').updateOne(
            { _id: ObjectId(body.author), },
            {
                $inc: { numOfComic: 1 }
            }
        )

        return res.status(200).json({
            err: 200,
            message: 'Success',
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
            message: 'Success',
        })
    }),

    detail: tryCatch(async (req, res) => {

    })
};

