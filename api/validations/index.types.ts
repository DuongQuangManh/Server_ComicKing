import Joi from 'joi'

export const emailShema = Joi.string().email().required()
    .messages({
        'string.email': 'Email không đúng định dạng.',
        'any.required': 'Email không được bỏ trống.',
    })

export const passwordShema = Joi.string().min(6).required().messages({
    'string.min': 'Mật khẩu phải có độ dài trên 6 kí tự.',
    'any.required': 'Mật khẩu không được bỏ trống.',
})

export const dateShema = Joi.string().regex(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/\d{4}$/).required().messages({
    'string.pattern.base': 'Ngày sinh không đúng định dạng.'
})

export const codeShema = Joi.string().length(6).alphanum().required().messages({
    'string.length': 'OTP phải có độc dài 6 kí tự.',
    'string.alphanum': 'OTP không đúng định dạng',
    'any.required': 'OTP không được bỏ trống'
})

export const fullNameShema = Joi.string().min(6).required().messages({
    'any.required': 'Họ tên không được bỏ trống.',
    'string.min': 'Họ tên phải trên 5 kí tự.'

})

export const confirmPasswordShema = Joi.string().valid(Joi.ref('password')).required().messages({
    'any.ref': 'Mật khẩu không trùng khớp.',
})