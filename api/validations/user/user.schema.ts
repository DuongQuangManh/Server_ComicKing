import Joi from 'joi'

export const registerShema = Joi.object({
    fullName: Joi.string().min(4).required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
})

export const loginShema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
})

export const registerVerifyOtpShema = Joi.object({
    email: Joi.string().email().required(),
    code: Joi.string().length(6).alphanum().required()
})