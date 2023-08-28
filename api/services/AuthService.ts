import JWT from 'jsonwebtoken'
import Bcryptjs from 'bcryptjs'
import Ejs from 'ejs'
import { AppError } from '../custom/customClass'
import transporterEmail from '../utils/transporterEmail'
import { VERIFY_OTP } from '../constants/EMAIL_TEMPLATES'

const SECRETKEY = process.env.SECRETKEY as string

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
    return Bcryptjs.compareSync(password, hashedPassword)
}

export const sendOtpEmail = async (otp: string, email: string) => {

    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: VERIFY_OTP.subject,
        html: Ejs.render(VERIFY_OTP.html, { otp })
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