/**
 * DecorateController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { AppError } from "../custom/customClass";
import tryCatch from "../utils/tryCatch";

declare const Decorate: any
declare const User: any

module.exports = {

    adminFind: tryCatch((req, res) => {

    }),

    add: tryCatch(async (req, res) => {
        const { title, description, image, needPoint, tag, type } = req.body
        if (!title || !description || !image || !needPoint)
            throw new AppError(400, 'Bad Request', 400)

        const createdDecorate = await Decorate.create({
            title, description,
            image, tag, needPoint,
            type
        }).fetch()
        if (!createdDecorate) throw new AppError(400, 'Không thể create vui lòng thử lại', 400)

        return res.status(200).json({ err: 200, message: 'Success' })
    }),

    edit: tryCatch(async (req, res) => {

    }),

    adminDetail: tryCatch(async (req, res) => {

    }),

    clientFind: tryCatch(async (req, res) => {
        const { tag = 'avatar', userId, type = 'level' } = req.body
        if (!userId) throw new AppError(400, 'Bad Request', 400)

        const getUserPromise = User.findOne({
            where: { id: userId },
            select: ['levelPoint', 'vipPoint']
        })
        const getListDecoratePromise = Decorate.find({ where: { tag, type } }).sort('needPoint')

        const [user, listDecorate] = await Promise.all([getUserPromise, getListDecoratePromise])
        if (!user) throw new AppError(400, 'User not exists in system', 400)
        if (!listDecorate) throw new AppError(400, 'Can not find Decorate. Pls try againt', 400)

        let haveCount = 0
        const newListDecorate = listDecorate.map((item: any) => {
            if (item.type == 'vip') {
                if (item.needPoint > user.vipPoint) item.isLock = true
                else {
                    haveCount++
                    item.isLock = false
                }
            } else if (item.type == 'level') {
                if (item.needPoint > user.levelPoint) item.isLock = true
                else {
                    haveCount++
                    item.isLock = false
                }
            } else if (item.type == 'event') {
                item.isLock = true
            }
            return item
        })

        return res.status(200).json({ 
            err: 200, message: 'Success', data: newListDecorate , haveCount
        })
    }),

};

