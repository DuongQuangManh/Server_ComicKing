/**
 * CategoryController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import tryCatch from "../utils/tryCatch";

declare const Category: any

module.exports = {
    findAll: tryCatch(async (req, res) => {
        const categories = await Category.find({
            where: {
                status: 'active'
            },
            select: ['title', 'description', 'numOfComic']
        })

        return res.status(200).json({
            message: 'Find Success',
            err: 200,
            data: categories
        })
    }),

    find: tryCatch(async (req, res) => {
        const { limit = 20, skip = 20, title, status } = req.body

        const findOption = {

        }

        const categories = await Category.find({
            select: ['title', 'description', 'numOfComic']
        })

        return res.status(200).json({
            message: 'Find Success',
            err: 200,
            data: categories
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

