import Joi from 'joi'

export const registerShema = Joi.object({
    email: Joi.string().email().required(),
    fullName: Joi.string().min(6).required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
})

export const loginShema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    needVerifyOtp: Joi.boolean()
})

export const verifyEmailOtpShema = Joi.object({
    email: Joi.string().email().required(),
    code: Joi.string().length(6).alphanum().required()
})