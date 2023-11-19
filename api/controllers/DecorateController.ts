/**
 * DecorateController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { constants } from "../constants/constants";
import { AppError } from "../custom/customClass";
import { uploadImage } from "../imagekit";
import { helper } from "../utils/helper";
import tryCatch from "../utils/tryCatch";
import { v4 as uuidV4 } from "uuid";

declare const Decorate: any;
declare const VipTicket: any;
declare const UserWallet: any;

module.exports = {
  adminFind: tryCatch(async (req, res) => {
    const { limit = 10, skip = 0 } = req.body;

    const getCountDecoratePromise = Decorate.count({});
    const getListDecoratePromise = Decorate.find({
      limit,
      skip,
    }).sort("createdAt DESC");

    const [total, listDecorate] = await Promise.all([
      getCountDecoratePromise,
      getListDecoratePromise,
    ]);

    listDecorate?.map((item) => {
      item.createdAt = helper.convertToStringDate(item.createdAt);
      item.updatedAt = helper.convertToStringDate(item.updatedAt);
    });

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: listDecorate,
      limit,
      skip,
      total,
    });
  }),

  add: tryCatch(async (req, res) => {
    const {
      title,
      image,
      needPoint,
      tag = "avatar",
      type = "level",
      needVipTicket = "",
      status = constants.COMMON_STATUS.ACTIVE,
    } = req.body;
    if (!title || !image || typeof needPoint != "number")
      throw new AppError(400, "Bad Request", 400);

    let vipTicket = null;
    if (type == "vip") {
      if (!needVipTicket)
        throw new AppError(400, "Require Vip Ticket with vip decorate.", 400);
      vipTicket = await VipTicket.findOne({ id: needVipTicket });
      if (!vipTicket)
        throw new AppError(400, "Vip ticket not exists in system", 400);
    }

    const uId = uuidV4();
    const { url } = await uploadImage(
      image,
      `${constants.IMAGE_FOLDER.DECORATE}/${uId}`,
      "image"
    );

    const createdDecorate = await Decorate.create({
      title,
      image: url,
      tag,
      needPoint,
      type,
      uId,
      status,
      needVipTicket: type == "vip" ? vipTicket.id : "",
    }).fetch();
    if (!createdDecorate)
      throw new AppError(400, "Không thể create vui lòng thử lại", 400);

    return res.status(200).json({ err: 200, message: "Success" });
  }),

  edit: tryCatch(async (req, res) => {
    const {
      title,
      image,
      needPoint,
      tag = "avatar",
      type = "level",
      needVipTicket = "",
      status = constants.COMMON_STATUS.ACTIVE,
      id,
    } = req.body;
    if (!title || !image || typeof needPoint != "number" || !id)
      throw new AppError(400, "Bad Request", 400);

    let vipTicket = null;
    if (type == "vip") {
      if (!needVipTicket)
        throw new AppError(400, "Require Vip Ticket with vip decorate.", 400);
      vipTicket = await VipTicket.findOne({ id: needVipTicket });
      if (!vipTicket)
        throw new AppError(400, "Vip ticket not exists in system", 400);
    }
    const decorate = await Decorate.findOne({ id });
    if (!decorate)
      throw new AppError(400, "Decorate not exists in system.", 400);

    if (decorate.image != image) {
      var { url } = await uploadImage(
        image,
        `${constants.IMAGE_FOLDER.DECORATE}/${decorate.uid}`,
        "image"
      );
    }
    const updatedDecorate = await Decorate.create({
      title,
      image: url ? url : decorate.image,
      tag,
      needPoint,
      type,
      status,
      needVipTicket: type == "vip" ? vipTicket.id : "",
    }).fetch();
    if (!updatedDecorate)
      throw new AppError(400, "Không thể create vui lòng thử lại", 400);

    return res.status(200).json({ err: 200, message: "Success" });
  }),

  adminDetail: tryCatch(async (req, res) => {
    const { decorateId } = req.body;
    if (!decorateId) throw new AppError(400, "Bad Request", 400);

    const decorate = await Decorate.findOne({ id: decorateId });
    if (!decorate)
      throw new AppError(400, "Decorate not exists in system", 400);
    decorate.updatedAt = helper.convertToStringDate(decorate.updatedAt);
    decorate.createdAt = helper.convertToStringDate(decorate.createdAt);

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: decorate,
    });
  }),

  clientFind: tryCatch(async (req, res) => {
    const { tag = "avatar", userId, type = "level" } = req.body;
    if (!userId) throw new AppError(400, "Bad Request", 400);

    const getUserWalletPromise = UserWallet.findOne({ user: userId });
    const getListDecoratePromise = Decorate.find({ where: { tag, type } }).sort(
      "needPoint"
    );

    const [listDecorate, userWallet] = await Promise.all([
      getListDecoratePromise,
      getUserWalletPromise,
    ]);
    if (!listDecorate)
      throw new AppError(400, "Can not find Decorate. Pls try againt", 400);
    if (!userWallet) throw new AppError(400, "Invalid User Wallet", 400);

    let haveCount = 0;
    const newListDecorate = listDecorate.map((item: any) => {
      if (item.needVipTicket) {
        if (userWallet.ticket?.vipTicket?.id == item.needVipTicket) {
          haveCount++;
          item.lock = false;
        } else {
          item.isLock = true;
        }
      } else {
        if (item.needPoint > userWallet.exp) item.isLock = true;
        else {
          haveCount++;
          item.isLock = false;
        }
      }
      //   if (item.type == "vip") {
      //     if (item.needPoint > userWallet.exp) item.isLock = true;
      //     else {
      //       haveCount++;
      //       item.isLock = false;
      //     }
      //   } else if (item.type == "level") {
      //     if (item.needPoint > userWallet.exp) item.isLock = true;
      //     else {
      //       haveCount++;
      //       item.isLock = false;
      //     }
      //   } else if (item.type == "event") {
      //     item.isLock = true;
      //   }
      return item;
    });

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: newListDecorate,
      haveCount,
    });
  }),
};
