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
import { v4 as uuidV4 } from 'uuid'
import { hashPassword } from "../services/AuthService";

declare const User: any

module.exports = {

    find: tryCatch(async (req, res) => {
        const { skip = 0, limit = 10, } = req.body
        const findOptions = {
            skip,
            limit
        }

        const [total, listUser] =
            await Promise.all([
                User.count({}),
                User.find({
                    select: ['email', 'fbId', 'fullName', 'nickName', 'createdAt', 'status', 'updatedAt'],
                    ...findOptions
                })
            ])

        for (let user of listUser) {
            user.createdAt = moment(user.createdAt).format(constants.DATE_TIME_FORMAT)
            user.updatedAt = moment(user.updatedAt).format(constants.DATE_TIME_FORMAT)
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
        const { email, fullName, nickName, birthday, gender, status, level, image, password } = req.body

        if (!fullName || !nickName || !birthday || !gender || !status || !level || !email || !password) {
            throw new AppError(400, 'Bad Request', 400)
        }

        const checkUser = await User.findOne({
            or: [
                { nickName },
                { email }
            ]
        })
        if (checkUser)
            throw new AppError(400, 'User đã tồn tại vui lòng nhập lại Email hoặc Nickname.', 400)

        const uId = uuidV4()
        if (image) {
            var { url } = await uploadImage(image, `${constants.IMAGE_FOLDER.USER}/${uId}`, 'avatar')
        }

        const createdUser = await User.create({
            fullName,
            nickName,
            birthday,
            gender,
            status,
            level,
            image: url ?? `${process.env}${constants.USER_AVATAR}`,
            uId,
            email,
            password: hashPassword(password)
        }).fetch()
        if (!createdUser) {
            throw new AppError(400, 'Không thể cập nhật user vui lòng thử lại', 400)
        }

        return res.status(200).json({
            err: 200,
            message: 'Success'
        })
    }),

    edit: tryCatch(async (req, res) => {
        const { id, fullName, nickName, birthday, gender, status, level, image } = req.body
        if (!fullName || !nickName || !birthday || !gender || !status || !level)
            throw new AppError(400, 'Bad Request', 400)

        if (await User.findOne({
            where: {
                nickName,
                id: { '!=': id }
            }
        })) throw new AppError(400, 'Nickname đã tồn tại vui lòng nhập lại.', 400)

        const checkUser = await User.findOne({ id })
        if (!checkUser) {
            throw new AppError(400, 'User không tồn tại', 400)
        }

        if (image && checkUser.image != image) {
            var { url } = await uploadImage(image, `${constants.IMAGE_FOLDER.USER}/${checkUser.uId}`, 'avatar')
        }
        const updatedUser = await User.updateOne({ id }).set({
            fullName,
            nickName,
            birthday,
            gender,
            status,
            level,
            image: url ?? checkUser.image
        })
        if (!updatedUser) {
            throw new AppError(400, 'Không thể cập nhật user vui lòng thử lại', 400)
        }

        return res.status(200).json({
            err: 200,
            message: 'Success'
        })
    }),

    detail: tryCatch(async (req, res) => {
        const { id } = req.body

        let user = await User.findOne({ id })

        delete user.password
        user.createdAt = moment(user.createdAt).format(constants.DATE_TIME_FORMAT)
        user.updatedAt = moment(user.updatedAt).format(constants.DATE_TIME_FORMAT)

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: user
        })
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

