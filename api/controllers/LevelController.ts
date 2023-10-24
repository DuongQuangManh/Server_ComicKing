/**
 * LevelController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { AppError } from "../custom/customClass";
import tryCatch from "../utils/tryCatch";

declare const Level: any
declare const User: any

module.exports = {

    adminFind: tryCatch(async (req, res) => {

    }),

    add: tryCatch(async (req, res) => {
        const { index, point, description, listPrivilege = [], startColor, endColor } = req.body
        if (isNaN(index) || index <= 0 || !point || !description)
            throw new AppError(400, 'Bad Request', 400)

        const checkLevelContainPromise = Level.find({ where: { index: { '>=': index } }, limit: 1 })
        const previousIndex = index - 1
        if (previousIndex >= 1) {
            var checkPreviousContainPromise = Level.findOne({ where: { index: previousIndex } })
        }
        const [checkLevelContain, checkPreviousContain] = await Promise.all([
            checkLevelContainPromise, checkPreviousContainPromise
        ])
        if (checkLevelContain?.[0]) throw new AppError(400, `Level ${index} had contain in system`, 400)
        if (!checkPreviousContain && previousIndex >= 1) {
            throw new AppError(400, `Pls add Level ${previousIndex} before.`, 400)
        } else if (checkPreviousContain) {
            if (point <= checkPreviousContain?.point) {
                throw new AppError(400, `Required Level poin > Level ${previousIndex} `, 400)
            }
        }

        const createLevelPromise = Level.create({
            point, index, description,
            listPrivilege, startColor, endColor
        }).fetch()
        const updatePreviousLevelPromise = Level.updateOne({ index: previousIndex }).set({ nextLevelPoint: point })
        const [createdLevel] = await Promise.all([createLevelPromise, updatePreviousLevelPromise])
        if (!createdLevel) throw new AppError(400, 'Không thể thêm Level, pls try again', 400)

        return res.json({ err: 200, message: 'Success' })
    }),

    edit: tryCatch(async (req, res) => {

    }),

    adminDetail: tryCatch(async (req, res) => {

    }),

    // api/user/findLevel
    clientFind: tryCatch(async (req, res) => {
        const { userId } = req.body
        if (!userId) throw new AppError(400, 'Bad Request', 400)

        const getUserPromise = User.findOne({ where: { id: userId }, select: ['levelPoint'] })
        const getListLevelPromise = Level.find({}).sort('index asc')
        const [user, listLevel] = await Promise.all([getUserPromise, getListLevelPromise])
        if (!user) throw new AppError(400, 'User not exists in system', 400)
        if (!listLevel) throw new AppError(400, 'Cannot get list Level. Pls try again.', 400)

        let currentLevelIndex = 0
        let reachedMax = false
        for (let i = 0; i < listLevel.length; i++) {
            if (user.levelPoint >= listLevel[i].point) {
                currentLevelIndex = listLevel[i].index
                if (i == listLevel.length - 1) {
                    reachedMax = true
                }
            } else {
                listLevel[i].needPoint = listLevel[i].point - user.levelPoint
            }
        }

        return res.status(200).json({
            err: 200, message: 'Success',
            data: { currentLevelIndex, levelPoint: user.levelPoint, reachedMax, listLevel }
        })
    })
};

