import Joi from "joi";
import {
  emailShema,
  passwordShema,
  codeShema,
  confirmPasswordShema,
  dateShema,
  fullNameShema,
  nickNameShema,
  genderSchema,
  idShema,
  imageShema,
  stringSchema,
} from "../index.types";

export const registerShema = Joi.object({
  email: emailShema,
  fullName: fullNameShema,
  password: passwordShema,
  confirmPassword: confirmPasswordShema,
  birthday: dateShema,
  deviceToken: stringSchema,
});

export const loginShema = Joi.object({
  email: emailShema,
  password: passwordShema,
  deviceToken: stringSchema,
  // needVerifyOtp: Joi.boolean()
});

export const verifyEmailOtpShema = Joi.object({
  email: emailShema,
  code: codeShema,
});

export const forgotPassShema = Joi.object({
  email: emailShema,
  birthday: dateShema,
  password: passwordShema,
  confirmPassword: confirmPasswordShema,
});

export const changePassShema = Joi.object({
  email: emailShema,
  oldPass: passwordShema,
  password: passwordShema,
  confirmPassword: confirmPasswordShema,
});

export const updateProfileShema = Joi.object({
  nickName: nickNameShema,
  birthday: dateShema,
  gender: genderSchema,
  id: idShema,
  image: imageShema,
  fullName: fullNameShema,
});
