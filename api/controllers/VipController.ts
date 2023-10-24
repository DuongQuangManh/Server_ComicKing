/**
 * VipController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { AppError } from "../custom/customClass";
import tryCatch from "../utils/tryCatch";

declare const Vip: any
declare const User: any

module.exports = {

    adminFind: tryCatch(async (req, res) => {

    }),

    add: tryCatch(async (req, res) => {
        const { index, point, description, listPrivilege = [] } = req.body
        if (isNaN(index) || index <= 0 || !point || !description)
            throw new AppError(400, 'Bad Request', 400)

        const checkVipContainPromise = Vip.find({ where: { index: { '>=': index } }, limit: 1 })
        const previousIndex = index - 1
        if (previousIndex >= 1) {
            var checkPreviousContainPromise = Vip.findOne({ where: { index: previousIndex } })
        }
        const [checkVipContain, checkPreviousContain] = await Promise.all([
            checkVipContainPromise, checkPreviousContainPromise
        ])
        if (checkVipContain?.[0]) throw new AppError(400, `Vip ${index} had contain in system`, 400)
        if (!checkPreviousContain && previousIndex >= 1) {
            throw new AppError(400, `Pls add vip ${previousIndex} before.`, 400)
        } else if (checkPreviousContain) {
            if (point <= checkPreviousContain?.point) {
                throw new AppError(400, `Required vip poin > vip ${previousIndex} `, 400)
            }
        }

        const createVipPromise = Vip.create({ point, index, description, listPrivilege }).fetch()
        const updatePreviousVipPromise = Vip.updateOne({ index: previousIndex }).set({ nextVipPoint: point })
        const [createdVip] = await Promise.all([createVipPromise, updatePreviousVipPromise])
        if (!createdVip) throw new AppError(400, 'Không thể thêm vip, pls try again', 400)

        return res.json({ err: 200, message: 'Success' })
    }),

    edit: tryCatch(async (req, res) => {

    }),

    adminDetail: tryCatch(async (req, res) => {

    }),

    // api/user/findVip
    clientFind: tryCatch(async (req, res) => {
        const { userId } = req.body
        if (!userId) throw new AppError(400, 'Bad Request', 400)

        const getUserPromise = User.findOne({ where: { id: userId }, select: ['vipPoint'] })
        const getListVipPromise = Vip.find({}).sort('index asc')
        const [user, listVip] = await Promise.all([getUserPromise, getListVipPromise])
        if (!user) throw new AppError(400, 'User not exists in system', 400)
        if (!listVip) throw new AppError(400, 'Cannot get list vip. Pls try again.', 400)

        let currentVipIndex = 0
        let reachedMax = false
        for (let i = 0; i < listVip.length; i++) {
            if (user.vipPoint >= listVip[i].point) {
                currentVipIndex = listVip[i].index
                if (i == listVip.length - 1) {
                    reachedMax = true
                }
            } else {
                listVip[i].needPoint = listVip[i].point - user.vipPoint
            }
        }

        return res.status(200).json({
            err: 200, message: 'Success',
            data: { currentVipIndex, vipPoint: user.vipPoint, reachedMax, listVip }
        })
    })
};

