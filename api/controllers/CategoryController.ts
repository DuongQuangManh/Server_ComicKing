/**
 * CategoryController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { constants } from "../constants/constants";
import { AppError } from "../custom/customClass";
import tryCatch from "../utils/tryCatch";
import { ObjectId } from 'mongodb'

declare const sails: any
declare const Category: any

module.exports = {

    clientFind: tryCatch(async (req, res) => {
        const listCategory = await Category.find({
            where: {
                status: constants.COMMON_STATUS.ACTIVE
            },
        })

        return res.status(200).json({
            message: 'Success', err: 200,
            data: listCategory,
        })
    }),

    adminFind: tryCatch(async (req, res) => {
        const { limit = 10, skip = 0 } = req.body

        const findOption = {
            limit, skip
        }

        const total = await Category.count({})
        const categories = await Category.find({
            select: ['title', 'description', 'numOfComic', 'status', 'createdAt'],
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

    getListComic: tryCatch(async (req, res) => {
        const { categoryId, skip = 0, limit = 15, sort = 'hot' } = req.body
        if (typeof (categoryId) != 'string') throw new AppError(400, 'Bad Request', 400)

        const db = sails.getDatastore().manager
        const listComic = await db.collection('comic').aggregate([
            {
                $lookup: {
                    from: 'comiccategory',
                    localField: '_id',
                    foreignField: 'comic',
                    as: 'categories'
                }
            },
            {
                $match: { "categories.category": ObjectId(categoryId) }
            },
            {
                $sort: sort == 'hot' ? { numOfView: -1, numOfLike: -1 } : { createdAt: -1 }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            },
            {
                $project: {
                    id: '$_id',
                    name: 1,
                    image: 1,
                    description: 1,
                    numOfComment: 1,
                    numOfLike: 1,
                    numOfChapter: 1,
                    numOfView: 1,
                    createdAt: 1,
                    updatedChapterAt: 1,
                }
            }
        ]).toArray()

        return res.status(200).json({
            err: 200, message: 'Success',
            data: listComic, skip, limit
        })
    })

};

