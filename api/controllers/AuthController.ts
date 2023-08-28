/**
 * AuthController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { AppError } from "../custom/customClass";
import {
    checkPassword,
    generateToken,
    hashPassword,
    sendOtpEmail,
    generateOtp
} from "../services/AuthService";
import tryCatch from "../utils/tryCatch";
import { loginValidation, registerValidation } from "../validations/user/user.validation";
import { generateUsername } from 'unique-username-generator'

declare var User: any
declare var Otp: any

module.exports = {

    register: tryCatch(async (req, res) => {
        const { body } = req
        registerValidation(body)

        const exitsUser = await User.findOne({ email: body.email })
        if (exitsUser) {
            throw new AppError(400, 'Email đã tồn tại! Vui lòng thử email khác.', 400)
        }

        await User.create({
            email: body.email,
            fullName: body.fullName,
            password: hashPassword(body.password),
            nickName: generateUsername()
        }).fetch()

        return res.status(200).json({
            err: 200,
            msg: 'Đăng kí thành công.',
            data: {}
        })
    }),

    registerVerifyOtp: tryCatch(async (req, res) => {

    }),

    login: tryCatch(async (req, res) => {
        const { body } = req
        loginValidation(body)

        const exitsUser = await User.findOne({
            where: { email: body.email },
            select: ['email', 'nickName', 'password']
        })
        if (!exitsUser)
            throw new AppError(400, "Email không tồn tại! Vui lòng thử email khác.", 400)

        const isPasswordMatch = checkPassword(exitsUser.password, body.password)
        if (!isPasswordMatch)
            throw new AppError(400, "Email hoặc mật khẩu không hợp lệ.", 400)

        const accessToken = generateToken({ email: exitsUser.email, nickName: exitsUser.nickName })

        const otpExpiration = Date.now() + 2 * 60 * 1000;
        const otp = generateOtp()

        sendOtpEmail("123456", "legiatuan03@gmail.com")

        return res.status(200).json({
            err: 200,
            msg: 'Đăng nhập thành công',
            data: { accessToken }
        })
    }),

    loginVerifyOtp: tryCatch((req, res, next) => {

    }),

    loginWithGoogle: tryCatch((req, res, next) => {

    })
};

