/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import moment from "moment";
import { AppError } from "../custom/customClass";
import { uploadImage } from "../imagekit";
import tryCatch from "../utils/tryCatch";
import { updateProfileValidation } from "../validations/user/user.validation";
import { constants } from "../constants/constants";

declare const User: any

module.exports = {

    find: tryCatch(async (req, res) => {
        const { skip = 0, limit = 10, } = req.body
        const findOptions = {
            skip,
            limit
        }

        const total = await User.count({})
        const listUser = await User.find({
            select: ['email', 'fbId', 'fullName', 'nickName', 'createdAt', 'status'],
            ...findOptions
        })

        for (let user of listUser) {
            user.createdAt = moment(user.createdAt).format(constants.DATE_TIME_FORMAT)
            if (!user.fbId) user.fbId = 'None'
            if (!user.email) user.email = 'None'
        }

        return res.status(200).json({
            err: 200,
            messsage: 'Success',
            data: listUser,
            total,
            ...findOptions
        })
    }),

    add: tryCatch(async (req, res) => {

    }),

    edit: tryCatch(async (req, res) => {

    }),

    detail: tryCatch(async (req, res) => {

    }),

    getProfile: tryCatch(async (req, res) => {
        const { id } = req.body

        if (!id)
            throw new AppError(400, 'ID người dùng không được bỏ trống.', 400)

        const checkUser = await User.findOne({
            where: {
                id
            },
            select: ['email', 'nickName', 'image', 'birthday', 'gender']
        })
        if (!checkUser)
            throw new AppError(400, 'User không tồn tại vui lòng thử lại hoặc kiểm tra ID.', 400)

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: checkUser
        })
    }),

    updateProfile: tryCatch(async (req, res) => {
        updateProfileValidation(req.body)
        const { id, nickName, birthday, gender, image, fullName } = req.body

        let checkUser = await await User.findOne({ id })
        if (!checkUser)
            throw new AppError(400, 'User không tồn tại vui lòng thử lại hoặc kiểm tra ID.', 400)

        checkUser = await User.findOne({
            where: {
                nickName,
                id: { '!=': id }
            }
        })
        if (checkUser)
            throw new AppError(400, 'Nickname đã tồn tại vui lòng nhập lại.', 400)

        const { url = `${process.env.IMAGEKIT_URL}` } = await uploadImage(image, `user/${id}`, 'avatar')

        const updatedUser =
            await User.updateOne({ id })
                .set({
                    nickName,
                    birthday,
                    gender,
                    image: url,
                    fullName
                })

        if (!updatedUser)
            throw new AppError(400, 'Không thể cập nhập user vui lòng thử lại.', 400)

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: {
                nickName: updatedUser.nickName,
                image: updatedUser.image,
                gender: updatedUser.gender,
                birthday: updatedUser.birthday,
                fullName: updatedUser.fullName
            }
        })
    }),
};

