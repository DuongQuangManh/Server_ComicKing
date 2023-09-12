/**
 * SpecialListController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { AppError } from "../custom/customClass";
import tryCatch from "../utils/tryCatch";

declare const SpecialList: any

module.exports = {

    find: tryCatch(async (req, res) => {

        const specialList = await SpecialList.find({})

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: specialList
        })
    }),

    add: tryCatch(async (req, res) => {
        const { title, description, displayType, comics } = req.body

        const createdSpecial = await SpecialList.created({
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
        const { title, description, displayType, comics } = req.body

        const createdSpecial = await SpecialList.created({
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
    })

};

