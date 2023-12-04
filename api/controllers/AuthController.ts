/**
 * AuthController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { authAdmin } from "../../config/firebase/firebase";
import {
  CHANGE_VERIFY_OTP_MAIL_TEMPLATE,
  FORGOT_VERIFY_OTP_MAIL_TEMPLATE,
  REGISTER_VERIFY_OTP_MAIL_TEMPLATE,
} from "../constants/EMAIL_TEMPLATES";
import { OTP_TIME_EXPIRE, OTP_TYPES } from "../constants/OTP";
import { AppError } from "../custom/customClass";
import {
  checkPassword,
  generateToken,
  hashPassword,
  otpVerificationhandler,
  getValidVerifyOtp,
  generateOtp,
  sendOtpEmail,
  getEmailTemplateWithOtpType,
} from "../services/AuthService";
import tryCatch from "../utils/tryCatch";
import { emailShema } from "../validations/index.types";
import {
  changePassValidation,
  forgotPassValidation,
  loginValidation,
  registerValidation,
  verifyEmailOtpValidation,
} from "../validations/user/user.validation";
import { generateUsername } from "unique-username-generator";
import { v4 as uuidV4 } from "uuid";

declare const User: any;
declare const Otp: any;
declare const OtpVerification: any;
declare const Decorate: any;
declare const UserWallet: any;
declare const Device: any;

module.exports = {
  sendDeviceInfo: tryCatch(async (req, res) => {
    const { deviceToken, deviceName, os, osVersion, appVersion } = req.body;
    if (!deviceToken) throw new AppError(400, "Bad Request", 400);

    const checkDevice = await Device.findOne({ deviceToken });
    if (checkDevice) {
      await Device.updateOne({ id: checkDevice.id }).set({
        deviceToken,
        deviceName,
        os,
        osVersion,
        appVersion,
      });
    } else {
      await Device.create({
        deviceToken,
        deviceName,
        os,
        osVersion,
        appVersion,
      });
    }

    return res.status(200).json({
      err: 200,
      message: "Success",
    });
  }),

  register: tryCatch(async (req, res) => {
    const { body } = req;
    registerValidation(body);
    body.email = body.email.toLowerCase();

    const exitsUser = await User.findOne({ email: body.email });
    if (exitsUser)
      throw new AppError(
        400,
        "Email đã tồn tại! Vui lòng thử email khác.",
        400
      );

    const oldOtpVerify = await OtpVerification.findOne({ email: body.email });
    // get otp verifycation object sent to user
    const newOtpVerify = await otpVerificationhandler(
      body.email,
      OTP_TYPES.REGISTER,
      {
        fullName: body.fullName,
        password: hashPassword(body.password),
        nickName: generateUsername(),
        birthday: body.birthday,
        deviceToken: body.deviceToken,
      },
      oldOtpVerify,
      REGISTER_VERIFY_OTP_MAIL_TEMPLATE
    );

    Promise.all([
      Otp.create({
        email: newOtpVerify.email,
        code: newOtpVerify.code,
        expiredAt: newOtpVerify.expiredAt,
        otpType: newOtpVerify.otpType,
      }),
    ]);
    return res.status(200).json({
      err: 200,
      message: `Vui lòng xác minh mã Otp (6 chữ số) từ email ${body.email} để hoàn thành đăng ký.`,
      email: body.email,
    });
  }),

  registerVerifyOtp: tryCatch(async (req, res) => {
    const { body } = req;
    verifyEmailOtpValidation(body);
    body.email = body.email?.toLowerCase();

    //check valid + get old otp verification of email
    const oldOtpVerify = await getValidVerifyOtp(
      body.email,
      body.code,
      OTP_TYPES.REGISTER
    );

    // update otp vefify after check valid
    const updateOtpVerifiPromise = OtpVerification.updateOne({
      email: body.email,
    }).set({ otpType: OTP_TYPES.REGISTER_SUCCESS, data: {} });
    const getAvatarFramePromise = Decorate.find({
      where: { needPoint: 0, tag: "avatar" },
      limit: 1,
    });
    const getAvatarTitlePromise = Decorate.find({
      where: { needPoint: 0, tag: "title" },
      limit: 1,
    });
    const createUserPromise = User.create({
      email: body.email,
      ...oldOtpVerify.data,
      uId: uuidV4(),
    }).fetch();
    const [avatarFrame, avatarTitle, createdUser] = await Promise.all([
      getAvatarFramePromise,
      getAvatarTitlePromise,
      createUserPromise,
      updateOtpVerifiPromise,
    ]);
    if (!createdUser)
      throw new AppError(
        400,
        "Không thể khởi tạo người dùng vui lòng thử lại.",
        400
      );

    const updateBody: any = {};
    if (avatarFrame?.[0]) updateBody.avatarFrame = avatarFrame[0].id;
    if (avatarTitle?.[0]) updateBody.avatarTitle = avatarTitle[0].id;
    const updatedUserPromise = User.updateOne({ id: createdUser.id }).set(
      updateBody
    );
    const createdUserWalletPromise = UserWallet.create({
      user: createdUser.id,
    });
    Promise.all([updatedUserPromise, createdUserWalletPromise]);

    const accessToken = generateToken({
      email: createdUser.email,
      nickName: createdUser.nickName,
      id: createdUser.id,
    });
    return res.status(200).json({
      err: 200,
      message: "Đăng kí thành công",
      data: {
        email: createdUser.email,
        accessToken,
        nickName: createdUser.nickName,
        id: createdUser.id,
        image: createdUser.image,
        fullName: createdUser.fullName,
      },
    });
  }),

  login: tryCatch(async (req, res) => {
    const { body } = req;
    loginValidation(body);
    body.email = body.email?.toLowerCase();

    const exitsUser = await User.findOne({
      where: { email: body.email },
      select: ["email", "nickName", "password", "image", "fullName"],
    });
    if (!exitsUser)
      throw new AppError(400, "Email hoặc mật khẩu không hợp lệ.", 400);

    checkPassword(exitsUser.password, body.password);

    await User.updateOne({ email: body.email }).set({
      deviceToken: body.deviceToken,
    });

    // if (body.needVerifyOtp == undefined || body.needVerifyOtp) {
    //     const checkOtp = await OtpVerification.findOne({ email: body.email })
    //     // update verifycation object sent to user
    //     const newOtpVerify = await otpVerificationhandler(
    //         body.email,
    //         OTP_TYPES.LOGIN,
    //         {},
    //         checkOtp,
    //         LOGIN_VERIFY_OTP_MAIL_TEMPLATE
    //     )

    //     await Otp.create({
    //         email: newOtpVerify.email,
    //         code: newOtpVerify.code,
    //         expiredAt: newOtpVerify.expiredAt,
    //         otpType: newOtpVerify.otpType
    //     })

    //     return res.status(200).json({
    //         err: 200,
    //         email: body.email,
    //         message: `Vui lòng xác minh mã Otp (6 chữ số) từ email ${body.email} để hoàn thành đăng nhập.`,
    //         needVerifyOtp: true
    //     })
    // }

    const accessToken = generateToken({
      email: exitsUser.email,
      nickName: exitsUser.nickName,
      id: exitsUser.id,
    });

    delete exitsUser.password;
    return res.status(200).json({
      err: 200,
      message: "Đăng nhập thành công",
      data: {
        accessToken,
        ...exitsUser,
      },
    });
  }),

  loginVerifyOtp: tryCatch(async (req, res) => {
    const { body } = req;
    verifyEmailOtpValidation(body);
    body.email = body.email?.toLowerCase();

    //check valid old otp verification of email
    await getValidVerifyOtp(body.email, body.code, OTP_TYPES.LOGIN);

    const newOtpVerify = await OtpVerification.updateOne({
      email: body.email,
    }).set({
      otpType: OTP_TYPES.LOGIN_SUCCESS,
      data: {},
    });
    if (!newOtpVerify)
      throw new AppError(400, "Lỗi cập nhật mã Otp vui lòng thử lại.", 400);

    const checkUser = await User.findOne({
      where: { email: body.email },
      select: ["email", "nickName", "image", "fullName"],
    });
    if (!checkUser) throw new AppError(400, "Người dùng không tồn tại.", 400);

    const accessToken = generateToken({
      email: checkUser.email,
      nickName: checkUser.nickName,
      id: checkUser.id,
    });
    return res.status(200).json({
      err: 200,
      message: "Đăng nhập thành công",
      data: {
        accessToken,
        ...checkUser,
      },
    });
  }),

  loginWithGoogle: tryCatch(async (req, res) => {
    const { idToken, deviceToken } = req.body;
    const decodedToken = await authAdmin.auth().verifyIdToken(idToken);
    let checkUser = await User.findOne({ email: decodedToken.email });
    if (!checkUser) {
      const nickName = generateUsername();
      const uId = uuidV4();
      const getAvatarFramePromise = Decorate.find({
        where: { needPoint: 0, tag: "avatar" },
        limit: 1,
      });
      const getAvatarTitlePromise = Decorate.find({
        where: { needPoint: 0, tag: "title" },
        limit: 1,
      });
      const [avatarFrame, avatarTitle] = await Promise.all([
        getAvatarFramePromise,
        getAvatarTitlePromise,
      ]);
      checkUser = await User.create({
        email: decodedToken.email?.toLowerCase(),
        image: decodedToken.picture,
        fullName: decodedToken.name,
        nickName,
        uId,
        avatarFrame: avatarFrame[0].id,
        avatarTitle: avatarTitle[0].id,
        deviceToken: deviceToken,
      }).fetch();

      if (!checkUser)
        throw new AppError(
          400,
          "Không thể khởi tạo tài khoản vui lòng thử lại.",
          400
        );

      Promise.all([
        UserWallet.create({
          user: checkUser.id,
        }),
      ]);
    } else {
      console.log("Set device Id");
      await User.updateOne({ email: decodedToken.email?.toLowerCase() }).set({
        deviceToken: deviceToken,
      });
    }

    const accessToken = generateToken({
      email: checkUser.email,
      nickName: checkUser.nickName,
      id: checkUser.id,
    });
    return res.status(200).json({
      err: 200,
      message: "Đăng nhập thành công",
      data: {
        accessToken,
        email: checkUser.email,
        image: checkUser.image,
        id: checkUser.id,
        fullName: checkUser.fullName,
        nickName: checkUser.nickName,
      },
    });
  }),

  loginWithFacebook: tryCatch(async (req, res) => {
    const { idToken, deviceToken } = req.body;
    const decodedToken = await authAdmin.auth().verifyIdToken(idToken);
    let checkUser = await User.findOne({ fbId: decodedToken.uid });

    if (!checkUser) {
      const nickName = generateUsername();
      const uId = uuidV4();
      const getAvatarFramePromise = Decorate.find({
        where: { needPoint: 0, tag: "avatar" },
        limit: 1,
      });
      const getAvatarTitlePromise = Decorate.find({
        where: { needPoint: 0, tag: "title" },
        limit: 1,
      });
      const [avatarFrame, avatarTitle] = await Promise.all([
        getAvatarFramePromise,
        getAvatarTitlePromise,
      ]);
      checkUser = await User.create({
        fbId: decodedToken.uid,
        image: decodedToken.picture,
        fullName: decodedToken.name,
        nickName,
        uId,
        avatarFrame: avatarFrame[0].id,
        avatarTitle: avatarTitle[0].id,
        deviceToken: deviceToken,
      }).fetch();
      if (!checkUser)
        throw new AppError(
          400,
          "Không thể khởi tạo tài khoản vui lòng thử lại.",
          400
        );

      Promise.all([
        UserWallet.create({
          user: checkUser.id,
        }),
      ]);
    } else {
      await User.updateOne({
        fbId: decodedToken.uid,
      }).set({
        deviceToken: deviceToken,
      });
    }

    const accessToken = generateToken({
      fbId: checkUser.fbId,
      nickName: checkUser.nickName,
      id: checkUser.id,
    });
    return res.status(200).json({
      err: 200,
      message: "Đăng nhập thành công",
      data: {
        accessToken,
        image: checkUser.image,
        id: checkUser.id,
        fullName: checkUser.fullName,
        nickName: checkUser.nickName,
      },
    });
  }),

  forgotPassword: tryCatch(async (req, res) => {
    const { body } = req;
    forgotPassValidation(body);
    body.email = body.email?.toLowerCase();

    const checkUser = await User.findOne({ email: body.email });
    if (!checkUser)
      throw new AppError(400, "Email không tồn tại trong hệ thống.", 400);
    if (checkUser.birthday != body.birthday)
      throw new AppError(400, "Ngày sinh không hợp lệ.", 400);

    const checkOtp = await OtpVerification.findOne({ email: body.email });
    // update verifycation object sent to user
    const newOtpVerify = await otpVerificationhandler(
      body.email,
      OTP_TYPES.FORGOT_PIN,
      { password: hashPassword(body.password) },
      checkOtp,
      FORGOT_VERIFY_OTP_MAIL_TEMPLATE
    );

    Promise.all([
      Otp.create({
        email: newOtpVerify.email,
        code: newOtpVerify.code,
        expiredAt: newOtpVerify.expiredAt,
        otpType: newOtpVerify.otpType,
      }),
    ]);

    return res.status(200).json({
      err: 200,
      message: `Vui lòng xác minh mã Otp (6 chữ số) từ email ${body.email} để thay đổi mật khẩu.`,
      email: body.email,
    });
  }),

  forgotPasswordVerifyOtp: tryCatch(async (req, res) => {
    const { body } = req;
    verifyEmailOtpValidation(body);
    body.email = body.email?.toLowerCase();

    const oldOtpVerify = await getValidVerifyOtp(
      body.email,
      body.code,
      OTP_TYPES.FORGOT_PIN
    );

    const newOtpVerify = await OtpVerification.updateOne({
      email: body.email,
    }).set({
      otpType: OTP_TYPES.FORGOT_PIN_SUCCESS,
      data: {},
    });
    if (!newOtpVerify)
      throw new AppError(400, "Lỗi cập nhật mã Otp vui lòng thử lại.", 400);

    const updatedUser = await User.updateOne({ email: body.email }).set({
      email: body.email,
      ...oldOtpVerify.data,
    });
    if (!updatedUser)
      throw new AppError(
        400,
        "Không thể cập nhật người dùng vui lòng thử lại.",
        400
      );

    return res.status(200).json({
      err: 200,
      message: "Thay đổi mật khẩu thành công.",
      data: {},
    });
  }),

  resendOtp: tryCatch(async (req, res) => {
    const { body } = req;
    const value = emailShema.validate(body.email);
    body.email = body.email?.toLowerCase();
    if (value.error) {
      throw new AppError(400, value.error.message, 400);
    }

    const checkOtp = await OtpVerification.findOne({ email: body.email });
    // update verifycation object sent to user
    if (!checkOtp)
      throw new AppError(
        400,
        `Không thể gửi otp qua email : ${body.emai}.`,
        400
      );

    const otpObj = {
      expiredAt: Date.now() + OTP_TIME_EXPIRE,
      code: generateOtp(),
    };
    sendOtpEmail(
      otpObj.code,
      body.email,
      getEmailTemplateWithOtpType(checkOtp.otpType)
    );

    const newOtpVerify = await OtpVerification.updateOne({
      email: body.email,
    }).set(otpObj);

    Promise.all([
      Otp.create({
        email: newOtpVerify.email,
        code: newOtpVerify.code,
        expiredAt: newOtpVerify.expiredAt,
        otpType: newOtpVerify.otpType,
      }),
    ]);

    return res.status(200).json({
      err: 200,
      message: `Resend otp thành công.`,
      email: body.email,
    });
  }),

  changePassword: tryCatch(async (req, res) => {
    const { body } = req;
    changePassValidation(body);
    body.email = body.email?.toLowerCase();

    const checkUser = await User.findOne({ email: body.email });
    if (!checkUser)
      throw new AppError(400, "Email không tồn tại trong hệ thống.", 400);

    checkPassword(checkUser.password, body.oldPass);

    const checkOtp = await OtpVerification.findOne({ email: body.email });
    // update verifycation object sent to user
    const newOtpVerify = await otpVerificationhandler(
      body.email,
      OTP_TYPES.CHANGE_PIN,
      {
        password: hashPassword(body.password),
      },
      checkOtp,
      CHANGE_VERIFY_OTP_MAIL_TEMPLATE
    );

    Promise.all([
      Otp.create({
        email: newOtpVerify.email,
        code: newOtpVerify.code,
        expiredAt: newOtpVerify.expiredAt,
        otpType: newOtpVerify.otpType,
      }),
    ]);

    return res.status(200).json({
      err: 200,
      message: `Vui lòng xác minh mã Otp (6 chữ số) từ email ${body.email} để thay đổi mật khẩu.`,
      email: body.email,
    });
  }),

  changePasswordVerifyOtp: tryCatch(async (req, res) => {
    const { body } = req;
    verifyEmailOtpValidation(body);
    body.email = body.email?.toLowerCase();

    const oldOtpVerify = await getValidVerifyOtp(
      body.email,
      body.code,
      OTP_TYPES.CHANGE_PIN
    );

    const newOtpVerify = await OtpVerification.updateOne({
      email: body.email,
    }).set({
      otpType: OTP_TYPES.CHANGE_PIN_SUCCESS,
      data: {},
    });
    if (!newOtpVerify)
      throw new AppError(400, "Lỗi cập nhật mã Otp vui lòng thử lại.", 400);

    const updatedUser = await User.updateOne({ email: body.email }).set({
      email: body.email,
      ...oldOtpVerify.data,
    });
    if (!updatedUser)
      throw new AppError(
        400,
        "Không thể cập nhật người dùng vui lòng thử lại.",
        400
      );

    return res.status(200).json({
      err: 200,
      message: "Thay đổi mật khẩu thành công.",
      data: {},
    });
  }),

  logout: tryCatch(async (req, res) => {
    const { userId } = req.body;

    await User.updateOne({ id: userId }).set({
      deviceToken: "",
    });

    return res.status(200).json({
      err: 200,
      message: "Success.",
    });
  }),
};
