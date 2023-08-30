/**
 * AuthController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { LOGIN_VERIFY_OTP_MAIL_TEMPLATE, REGISTER_VERIFY_OTP_MAIL_TEMPLATE } from "../constants/EMAIL_TEMPLATES";
import { OTP_TYPES } from "../constants/OTP";
import { AppError } from "../custom/customClass";
import {
    checkPassword,
    generateToken,
    hashPassword,
    otpVerificationhandler,
    getValidVerifyOtp
} from "../services/AuthService";
import tryCatch from "../utils/tryCatch";
import {
    loginValidation,
    registerValidation,
    verifyEmailOtpValidation
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

        const existOtp = await OtpVerification.findOne({ email: body.email })
        // get otp verifycation object sent to user
        const otpVerify =
            await otpVerificationhandler(
                body.email,
                OTP_TYPES.REGISTER,
                {
                    fullName: body.fullName,
                    password: hashPassword(body.password),
                    nickName: generateUsername()
                },
                existOtp,
                REGISTER_VERIFY_OTP_MAIL_TEMPLATE
            )

        await Otp.create({
            email: otpVerify.email,
            code: otpVerify.code,
            expireAt: otpVerify.expireAt,
            otpType: otpVerify.otpType
        })
        return res.status(200).json({
            err: 200,
            msg: `Vui lòng xác minh mã Otp từ email ${body.email} để hoàn thành đăng ký.`,
        })
    }),

    registerVerifyOtp: tryCatch(async (req, res) => {
        const { body } = req
        verifyEmailOtpValidation(body)

        //check valid + get old otp verification of email
        const oldOtpVerify = await getValidVerifyOtp(body.email, body.code, OTP_TYPES.REGISTER)

        // update otp vefify after check valid
        const newOtpVerify =
            await OtpVerification
                .updateOne({ email: body.email })
                .set({
                    otpType: OTP_TYPES.REGISTER_SUCCESS,
                    data: {}
                })
        if (!newOtpVerify)
            throw new AppError(400, 'Lỗi cập nhật mã Otp vui lòng thử lại.', 400)

        const newUser = await User.create({
            email: body.email,
            ...oldOtpVerify.data
        }).fetch()
        if (!newUser)
            throw new AppError(400, 'Không thể khởi tạo người dùng vui lòng thử lại.', 400)

        return res.status(200).json({
            err: 200,
            msg: 'Đăng kí thành công',
            data: {
                email: newUser.email
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

        checkPassword(exitsUser.password, body.password)

        if (body.needVerifyOtp == undefined || body.needVerifyOtp) {
            const existOtp = await OtpVerification.findOne({ email: body.email })
            // update verifycation object sent to user
            await otpVerificationhandler(
                body.email,
                OTP_TYPES.LOGIN,
                {},
                existOtp,
                LOGIN_VERIFY_OTP_MAIL_TEMPLATE
            )

            return res.status(200).json({
                err: 200,
                msg: `Vui lòng xác minh mã Otp từ email ${body.email} để hoàn thành đăng nhập.`,
                needVerifyOtp: true
            })
        }

        const accessToken = generateToken({
            email: exitsUser.email,
            nickName: exitsUser.nickName,
            userId: exitsUser.id
        })
        return res.status(200).json({
            err: 200,
            msg: 'Đăng nhập thành công',
            data: { accessToken }
        })
    }),

    loginVerifyOtp: tryCatch(async (req, res) => {
        const { body } = req
        verifyEmailOtpValidation(body)

        //check valid old otp verification of email
        await getValidVerifyOtp(body.email, body.code, OTP_TYPES.LOGIN)

        const newOtpVerify =
            await OtpVerification
                .updateOne({ email: body.email })
                .set({
                    otpType: OTP_TYPES.LOGIN_SUCCESS,
                    data: {}
                })
        if (!newOtpVerify)
            throw new AppError(400, 'Lỗi cập nhật mã Otp vui lòng thử lại.', 400)

        const exitsUser = await User.findOne({
            where: { email: body.email },
            select: ['email', 'nickName', 'password']
        })
        if (!exitsUser)
            throw new AppError(400, "Người dùng không tồn tại.", 400)

        const accessToken = generateToken({
            email: exitsUser.email,
            nickName: exitsUser.nickName,
            userId: exitsUser.id
        })
        return res.status(200).json({
            err: 200,
            msg: 'Đăng nhập thành công',
            data: { accessToken }
        })
    }),

    loginWithGoogle: tryCatch((req, res, next) => {

    })
};

