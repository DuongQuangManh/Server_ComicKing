/**
 * OtpController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import tryCatch from "../utils/tryCatch";

declare const Otp: any

module.exports = {

    find: tryCatch(async (req, res) => {
        const { skip = 0, limit = 15, } = req.body
        const findOptions = {
            skip,
            limit
        }

        if (skip == 0) {
            var numRecords = await Otp.count({})
        }

        const listOtp = await Otp.find({
            ...findOptions
        })

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: {
                numRecords,
                ...findOptions,
                listOtp
            },
        })
    })

};

