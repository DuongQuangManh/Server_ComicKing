/**
 * CategoryController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { constants } from "../constants/constants";
import tryCatch from "../utils/tryCatch";

declare const Category: any

module.exports = {
    get: tryCatch(async (req, res) => {
        const { limit = 30, skip = 0 } = req.body
        const findOption = { skip, limit }

        const categories = await Category.find({
            where: {
                status: constants.COMMON_STATUS.ACTIVE
            },
            select: ['title', 'description', 'numOfComic'],
            ...findOption
        })

        return res.status(200).json({
            message: 'Find Success',
            err: 200,
            data: categories,
            findOption
        })
    }),

    find: tryCatch(async (req, res) => {
        const { limit = 10, skip = 0 } = req.body

        const findOption = {
            limit, skip
        }

        const total = await Category.count({})
        const categories = await Category.find({
            select: ['title', 'description', 'numOfComic', 'status'],
            ...findOption
        })

        return res.status(200).json({
            message: 'Find Success',
            err: 200,
            data: categories,
            total,
            ...findOption
        })
    }),

    add: tryCatch(async (req, res) => {

        const body = req.body

        const category = await Category.createEach(body).fetch()

        return res.status(200).json({
            message: 'Add success',
            err: 200,
            data: category
        })
    }),

    edit: tryCatch(async (req, res) => {

        const body = req.body

        const category = await Category.createEach(body).fetch()

        return res.status(200).json({
            message: 'Add success',
            err: 200,
            data: category
        })
    }),

};

