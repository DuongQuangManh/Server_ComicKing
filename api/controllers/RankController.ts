/**
 * RankController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { getDateRangeByTimeline } from "../services";
import tryCatch from "../utils/tryCatch";

declare const sails: any
declare const User: any

const db = sails.getDatastore().manager

module.exports = {

    getRankHotComic: tryCatch(async (req, res) => {
        const { skip = 0, limit = 15 } = req.body
        const listComic = await db.collection('comic').aggregate([
            {
                $sort: { numOfView: -1, numOfLike: -1 }
            },
            {
                $skip: skip
            },
            {
                $limit: limit < 50 ? limit : 50
            },
            {
                $project: {
                    id: '$_id',
                    image: 1,
                    name: 1,
                    description: 1,
                    numOfChapter: 1,
                    numOfLike: 1,
                    numOfView: 1
                }
            },
        ]).toArray()

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: listComic,
            skip, limit
        })
    }),

    getRankNewComic: tryCatch(async (req, res) => {
        const { skip = 0, limit = 15 } = req.body
        const listComic = await db.collection('comic').aggregate([
            {
                $sort: { numOfView: -1, numOfLike: -1 }
            },
            {
                $skip: skip
            },
            {
                $limit: limit < 50 ? limit : 50
            },
            {
                $project: {
                    id: '$_id',
                    image: 1,
                    name: 1,
                    description: 1,
                    numOfChapter: 1,
                    numOfLike: 1,
                    numOfView: 1
                }
            },
        ]).toArray()

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: listComic,
            skip, limit
        })
    }),

    getRankDoneComic: tryCatch(async (req, res) => {
        const { skip = 0, limit = 15 } = req.body
        const listComic = await db.collection('comic').aggregate([
            {
                $sort: { numOfView: -1, numOfLike: -1 }
            },
            {
                $skip: skip
            },
            {
                $limit: limit < 50 ? limit : 50
            },
            {
                $project: {
                    id: '$_id',
                    image: 1,
                    name: 1,
                    description: 1,
                    numOfChapter: 1,
                    numOfLike: 1,
                    numOfView: 1
                }
            },
        ]).toArray()

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: listComic,
            skip, limit
        })
    }),

    getRankUserLevel: tryCatch(async (req, res) => {
        const { skip = 0, limit = 15 } = req.body

        const listUser = await db.collection('user').aggregate([
            {
                $lookup: {
                    from: 'decorate',
                    localField: 'avatarFrame',
                    foreignField: '_id',
                    as: 'avatarFrame'
                }
            },
            {
                $unwind: '$avatarFrame'
            },
            {
                $lookup: {
                    from: 'decorate',
                    localField: 'avatarTitle',
                    foreignField: '_id',
                    as: 'avatarTitle'
                }
            },
            {
                $unwind: '$avatarTitle'
            },
            {
                $sort: { levelPoint: -1 }
            },
            {
                $skip: skip
            },
            {
                $limit: limit < 50 ? limit : 50
            },
            {
                $project: {
                    id: '$_id',
                    image: 1,
                    fullName: 1,
                    avatarFrame: {
                        id: "$avatarFrame._id",
                        image: "$avatarFrame.image"
                    },
                    avatarTitle: {
                        id: "$avatarTitle._id",
                        image: "$avatarTitle.image"
                    },
                }
            },
        ]).toArray()

        const listUser2 = await User.find({}).populate('avatarFrame').populate('avatarTitle')

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: listUser,
            data2: listUser2,
            skip, limit
        })
    }),

    getRankUserPurchase: tryCatch(async (req, res) => {

    }),



};

