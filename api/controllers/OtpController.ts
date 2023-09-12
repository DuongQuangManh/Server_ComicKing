/**
 * OtpController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import moment from "moment";
import tryCatch from "../utils/tryCatch";
import { constants } from "../constants/constants";

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

        for (let o of listOtp) {
            o.createdAt = moment(o.createdAt).format(constants.DATE_TIME_FORMAT)
            o.expiredAt = moment(o.expiredAt).format(constants.DATE_TIME_FORMAT)
        }

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

