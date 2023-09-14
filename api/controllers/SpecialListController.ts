/**
 * SpecialListController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import moment from "moment";
import { AppError } from "../custom/customClass";
import tryCatch from "../utils/tryCatch";
import { constants } from "../constants/constants";

declare const SpecialList: any

module.exports = {

    find: tryCatch(async (req, res) => {
        const { skip = 0, limit = 15, } = req.body
        const findOptions = {
            skip,
            limit
        }
        if (skip == 0) {
            var total = await SpecialList.count({})
        }
        const specialList = await SpecialList.find({})
        for (let sp of specialList) {
            sp.createdAt = moment(sp.createdAt).format(constants.DATE_TIME_FORMAT)
            sp.numOfComic = sp.comic?.length ?? 0
        }
        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: specialList,
            total,
            ...findOptions
        })
    }),

    detail: tryCatch(async (req, res) => {



    }),

    add: tryCatch(async (req, res) => {
        const { title, description, displayType, comics } = req.body
        if (!title || !description || !displayType)
            throw new AppError(400, 'Bad request', 400)

        const createdSpecial = await SpecialList.create({
            title,
            description,
            displayType,
            comics
        }).fetch()

        if (!createdSpecial)
            throw new AppError(400, 'Không thể thêm vui lòng thử lại', 400)

        return res.status(200).json({
            err: 200,
            message: 'Add success',
        })

    }),

    edit: tryCatch(async (req, res) => {
        const { id, title, description, displayType, comics } = req.body
        if (!id)
            throw new AppError(400, 'Bad request', 400)

        const updatedSpecial = await SpecialList.updateOne({
            id
        }).set({
            title,
            description,
            displayType,
            comics
        }).fetch()

        if (!updatedSpecial)
            throw new AppError(400, 'Không thể cập nhật vui lòng kiểm tra lại ID hoặc thử lại.', 400)

        return res.status(200).json({
            err: 200,
            message: 'Update success',
        })
    })

};

