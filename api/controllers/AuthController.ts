/**
 * AuthController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { OTP_TIME_EXPIRE, OTP_TYPES } from "../constants/OTP";
import { AppError } from "../custom/customClass";
import {
    checkPassword,
    generateToken,
    hashPassword,
    sendOtpEmail,
    generateOtp
} from "../services/AuthService";
import tryCatch from "../utils/tryCatch";
import {
    loginValidation,
    registerValidation,
    registerVerifyOtpValidation
} from "../validations/user/user.validation";
import { generateUsername } from 'unique-username-generator'

declare var User: any
declare var Otp: any
declare var OtpVerification: any

module.exports = {

    register: tryCatch(async (req, res) => {
        const { body } = req
        registerValidation(body)

        const exitsUser = await User.findOne({ email: body.email })
        if (exitsUser)
            throw new AppError(400, 'Email đã tồn tại! Vui lòng thử email khác.', 400)

        const existOtp = OtpVerification.findOne({ email: body.email })
        const otpObj = {
            email: body.email,
            otpType: OTP_TYPES.REGISTER_OTP,
            expireAt: Date.now() + OTP_TIME_EXPIRE,
            data: {
                fullName: body.fullName,
                password: hashPassword(body.password),
                nickName: generateUsername()
            }
        }

        sendOtpEmail(otpObj.otpType, otpObj.email)

        // advoid wrong unique email
        const otpVerify = existOtp ?
            await OtpVerification.updateOne({ otpObj: body.email }).set(otpObj)
            : await OtpVerification.create(otpObj).fetch()
        if (otpVerify)
            throw new AppError(500, 'Không thể tạo mã otp vui lòng thử lại.', 500)

        await Otp.create({
            email: otpVerify.email,
            code: otpVerify.code,
            expireAt: otpVerify.expireAt,
        })

        return res.status(200).json({
            err: 200,
            msg: `Xác minh mã Otp từ email ${body.email} để đăng ký.`,
        })
    }),

    registerVerifyOtp: tryCatch(async (req, res) => {
        const { body } = req
        registerVerifyOtpValidation(body)

        const existOtp = OtpVerification.findOne({ email: body.email })
        if (!existOtp)
            throw new AppError(400, 'Email không tồn tại Otp.', 400)

        if (existOtp.code != body.code || existOtp.otpType != OTP_TYPES.REGISTER_OTP)
            throw new AppError(400, 'Mã Otp không hợp lệ.', 400)

        if (existOtp.expireAt < Date.now())
            throw new AppError(400, 'Mã Otp đã hết hạn vui lòng thử lại.', 400)

        const otpVefify = OtpVerification.updateOne({ email: body.email }).set({ otpType: '', data: {} })
        if (!otpVefify)
            throw new AppError(400, 'Lỗi cập nhật mã Otp vui lòng thử lại.', 400)

        const createdUser = User.create({
            email: body.email,
            ...existOtp.data
        }).fetch()
        if (!createdUser)
            throw new AppError(400, 'Không thể khởi tạo người dùng vui lòng thử lại.', 400)

        return res.status(200).json({
            err: 200,
            msg: 'Đăng kí thành công',
            data: {
                email: createdUser.email
            }
        })
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

