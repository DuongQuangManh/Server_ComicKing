import JWT from 'jsonwebtoken'
import Bcryptjs from 'bcryptjs'
import Ejs from 'ejs'
import transporterEmail from '../utils/transporterEmail'
import { IEmailTemplate, IOtpVerification } from '../custom/types/otp.type'
import { OTP_TIME_EXPIRE, OTP_TYPES } from '../constants/OTP'
import { AppError } from '../custom/customClass'
import { CHANGE_VERIFY_OTP_MAIL_TEMPLATE, FORGOT_VERIFY_OTP_MAIL_TEMPLATE, LOGIN_VERIFY_OTP_MAIL_TEMPLATE, REGISTER_VERIFY_OTP_MAIL_TEMPLATE } from '../constants/EMAIL_TEMPLATES'

const SECRETKEY = process.env.SECRETKEY as string

declare var OtpVerification: any

export const generateToken = (payload: (string | object | Buffer)) => {
    const token = JWT.sign(payload, SECRETKEY, {
        expiresIn: '1h'
    })
    return token
}

export const hashPassword = (password: string) => {
    const salt = Bcryptjs.genSaltSync()
    const hashedPassword = Bcryptjs.hashSync(password, salt)
    return hashedPassword
}

export const checkPassword = (hashedPassword: string, password: string) => {
    const isMatch = Bcryptjs.compareSync(password, hashedPassword)
    if (!isMatch)
        throw new AppError(400, "Email hoặc mật khẩu không hợp lệ.", 400)
}

export const sendOtpEmail = async (otp: string, email: string, mailTemplate: IEmailTemplate) => {
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: mailTemplate.subject,
        html: Ejs.render(mailTemplate.html, { otp })
    }

    transporterEmail(mailOptions)
}

export const generateOtp = (length = 6) => {
    let otp: string = ''
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10)
    }
    return otp
}

// handle otpVerify sent to user
export const otpVerificationhandler = async (
    email: string,
    type: string,
    data: any = {},
    isCreate: any,
    mailTemplate: IEmailTemplate
) => {
    const otpObj = {
        email: email,
        otpType: type,
        expireAt: Date.now() + OTP_TIME_EXPIRE,
        code: generateOtp(),
        data
    }
    sendOtpEmail(otpObj.code, email, mailTemplate)

    // avoid unique email
    const otpVerify = isCreate ?
        await OtpVerification.updateOne({ email }).set(otpObj)
        : await OtpVerification.create(otpObj).fetch()
    if (!otpVerify)
        throw new AppError(500, 'Không thể cập nhật mã otp vui lòng thử lại.', 500)

    return otpVerify as IOtpVerification
}

export const getValidVerifyOtp = async (email: string, code: string, type: string) => {
    const existOtp = await OtpVerification.findOne({ email })
    if (!existOtp)
        throw new AppError(400, 'Email không tồn tại Otp.', 400)

    if (existOtp.otpType != type)
        throw new AppError(400, 'Otp type không hợp lệ.', 400)

    if (existOtp.code != code)
        throw new AppError(400, 'Mã Otp không hợp lệ.', 400)

    if (existOtp.expireAt < Date.now())
        throw new AppError(400, 'Mã Otp đã hết hạn vui lòng thử lại.', 400)
    return existOtp as IOtpVerification
}

export const getEmailTemplateWithOtpType = (type: string) => {

    switch (type) {
        case type = OTP_TYPES.LOGIN:
            return LOGIN_VERIFY_OTP_MAIL_TEMPLATE
        case type = OTP_TYPES.CHANGE_PIN:
            return CHANGE_VERIFY_OTP_MAIL_TEMPLATE
        case type = OTP_TYPES.FORGOT_PIN:
            return FORGOT_VERIFY_OTP_MAIL_TEMPLATE
        case type = OTP_TYPES.REGISTER:
            return REGISTER_VERIFY_OTP_MAIL_TEMPLATE
        default:
            return CHANGE_VERIFY_OTP_MAIL_TEMPLATE
    }

}