/**
 * VipTicketController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { constants } from "../constants/constants";
import { AppError } from "../custom/customClass";
import { helper } from "../utils/helper";
import tryCatch from "../utils/tryCatch";

declare const VipTicket: any;
declare const Decorate: any;

module.exports = {
  adminFind: tryCatch(async (req, res) => {
    const { limit = 10, skip = 0 } = req.body;

    const getCountVipTicketPromise = VipTicket.count({});
    const getListVipTicketPromise = VipTicket.find({
      limit,
      skip,
    }).sort("createdAt DESC");

    const [total, listVipTicket] = await Promise.all([
      getCountVipTicketPromise,
      getListVipTicketPromise,
    ]);

    listVipTicket?.map((item, index) => {
      item.createdAt = helper.convertToStringDate(item.createdAt);
      item.duration = Math.round(item.duration / (1000 * 60 * 60 * 24));
    });

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: listVipTicket,
      limit,
      skip,
      total,
    });
  }),

  edit: tryCatch(async (req, res) => {
    const {
      price,
      duration,
      coinExtraDaily,
      expExtraDaily,
      priority,
      coinExtra,
      expExtra,
      status = constants.COMMON_STATUS.ACTIVE,
      id,
      name,
      // image,
    } = req.body;
    console.log(req.body);
    if (
      typeof price != "number" ||
      typeof duration != "number" ||
      typeof coinExtra != "number" ||
      typeof expExtra != "number" ||
      typeof expExtraDaily != "number" ||
      typeof coinExtraDaily != "number" ||
      typeof priority != "number" ||
      typeof name != "string"
      // typeof image != "string"
    )
      throw new AppError(400, "Bad Request", 400);

    if (duration % 1 != 0 || duration < 1)
      throw new AppError(400, "Invalid duration", 400);

    const updatedVipTicket = await VipTicket.updateOne({ id }).set({
      price,
      duration: duration * 1000 * 60 * 60 * 24,
      coinExtra,
      expExtra,
      expExtraDaily,
      coinExtraDaily,
      priority,
      status,
      name,
      // image,
    });

    if (!updatedVipTicket)
      throw new AppError(400, "Can't update vip ticket. Pls try again.", 400);

    return res.status(200).json({
      message: "Success",
      err: 200,
    });
  }),

  adminDetail: tryCatch(async (req, res) => {
    const { vipTicketId } = req.body;
    if (!vipTicketId) throw new AppError(400, "Bad Request", 400);

    const vipTicket = await VipTicket.findOne({ id: vipTicketId });

    if (!vipTicket)
      throw new AppError(400, "Vip Ticket not exists in system", 400);

    vipTicket.createdAt = helper.convertToStringDate(vipTicket.createdAt);
    vipTicket.updatedAt = helper.convertToStringDate(vipTicket.updatedAt);
    vipTicket.duration = Math.round(vipTicket.duration / (1000 * 60 * 60 * 24));

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: vipTicket,
    });
  }),

  add: tryCatch(async (req, res) => {
    const {
      price,
      duration,
      coinExtraDaily,
      expExtraDaily,
      priority,
      coinExtra,
      expExtra,
      image,
      name,
      status = constants.COMMON_STATUS.ACTIVE,
    } = req.body;
    if (
      typeof price != "number" ||
      typeof duration != "number" ||
      typeof coinExtra != "number" ||
      typeof expExtra != "number" ||
      typeof expExtraDaily != "number" ||
      typeof coinExtraDaily != "number" ||
      typeof priority != "number" ||
      typeof name != "string"
    )
      throw new AppError(400, "Bad Request", 400);

    if (duration % 1 != 0 || duration < 1)
      throw new AppError(400, "Invalid duration", 400);

    const createdVipTicket = await VipTicket.create({
      price,
      duration: duration * 1000 * 60 * 60 * 24,
      coinExtra,
      expExtra,
      expExtraDaily,
      coinExtraDaily,
      priority,
      status,
      image,
      name,
    }).fetch();

    if (!createdVipTicket)
      throw new AppError(400, "Can't create vip ticket. Pls try again.", 400);

    return res.status(200).json({
      message: "Success",
      err: 200,
    });
  }),

  clientFind: tryCatch(async (req, res) => {
    const { limit = 10, skip = 0 } = req.body;

    const listVipTicket = await VipTicket.find({
      where: {
        status: constants.COMMON_STATUS.ACTIVE,
      },
      select: [
        "price",
        "duration",
        "coinExtraDaily",
        "expExtraDaily",
        "expExtra",
        "coinExtra",
        "currency",
        "image",
        "name",
      ],
      limit,
      skip,
    }).sort("priority DESC");

    listVipTicket.forEach((vipTicket) => {
      vipTicket.duration = vipTicket.duration / (1000 * 60 * 60 * 24);
    });

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: listVipTicket,
    });
  }),

  clientDetail: tryCatch(async (req, res) => {
    const { vipTicketId } = req.body;
    if (typeof vipTicketId != "string")
      throw new AppError(400, "Bad Request", 400);

    const getVipTicketPromise = VipTicket.findOne({ id: vipTicketId });
    const getListAvatarFramePromise = Decorate.find({
      where: {
        tag: "avatar",
        needVipTicket: vipTicketId,
      },
    });
    const getListAvatarTitlePromise = Decorate.find({
      where: {
        tag: "title",
        needVipTicket: vipTicketId,
      },
    });

    const [vipTicket, listAvatarFrame, listAvatarTitle] = await Promise.all([
      getVipTicketPromise,
      getListAvatarFramePromise,
      getListAvatarTitlePromise,
    ]);

    if (!vipTicket) throw new AppError(400, "Invalid Vip Ticket.", 400);
    vipTicket.duration = vipTicket.duration / (1000 * 60 * 60 * 24);

    return res.status(200).json({
      message: "Success",
      err: 200,
      data: {
        vipTicket,
        listAvatarFrame,
        listAvatarTitle,
      },
    });
  }),
};
