import Joi from 'joi'
import {
    emailShema,
    passwordShema,
    codeShema,
    confirmPasswordShema,
    dateShema,
    fullNameShema
} from '../index.types'

export const registerShema = Joi.object({
    email: emailShema,
    fullName: fullNameShema,
    password: passwordShema,
    confirmPassword: confirmPasswordShema,
    birthday: dateShema
})

export const loginShema = Joi.object({
    email: emailShema,
    password: passwordShema,
    // needVerifyOtp: Joi.boolean()
})

export const verifyEmailOtpShema = Joi.object({
    email: emailShema,
    code: codeShema
})

export const forgotPassShema = Joi.object({
    email: emailShema,
    birthday: dateShema,
    password: passwordShema,
    confirmPassword: confirmPasswordShema
})

export const changePassShema = Joi.object({
    email: emailShema,
    oldPass: passwordShema,
    newPass: passwordShema,
    confirmNewPass: confirmPasswordShema
})