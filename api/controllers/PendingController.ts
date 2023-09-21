/**
 * PendingController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import tryCatch from "../utils/tryCatch";

declare const Category: any
declare const Author: any

module.exports = {

    getAdminPendingData: tryCatch(async (req, res) => {

        const categories = await Category.find({
            select: ['title']
        })
        const authors = await Author.find({
            select: ['name']
        })

        const pendingData = {
            categories,
            authors
        }

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: pendingData
        })
    })
};

