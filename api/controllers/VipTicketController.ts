/**
 * VipTicketController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { constants } from "../constants/constants";
import { AppError } from "../custom/customClass";
import tryCatch from "../utils/tryCatch";

declare const VipTicket: any;

module.exports = {
  adminFind: tryCatch(async (req, res) => {
    const { limit = 10, skip = 0 } = req.body;

    const listVipTicket = await VipTicket.find({
      limit,
      skip,
    }).sort("createdAt DESC");

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: listVipTicket,
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
      expEtra,
      status = constants.COMMON_STATUS.ACTIVE,
      id,
      image,
    } = req.body;

    if (
      typeof price != "number" ||
      typeof duration != "number" ||
      typeof coinExtra != "number" ||
      typeof expEtra != "number" ||
      typeof expExtraDaily != "number" ||
      typeof coinExtraDaily != "number" ||
      typeof priority != "number" ||
      typeof image != "string"
    )
      throw new AppError(400, "Bad Request", 400);

    if (duration % (1000 * 60 * 60 * 24) != 0)
      throw new AppError(400, "Invalid duration", 400);

    const updatedVipTicket = await VipTicket.updateOne({ id })
      .set({
        price,
        duration,
        coinExtra,
        expEtra,
        expExtraDaily,
        coinExtraDaily,
        priority,
        status,
        image,
      })
      .fetch();

    if (!updatedVipTicket)
      throw new AppError(400, "Can't update vip ticket. Pls try again.", 400);

    return res.status(200).json({
      message: "Success",
      err: 200,
    });
  }),

  adminDetail: tryCatch(async (req, res) => {
    const { id } = req.body;

    const vipTicket = await VipTicket.findOne({ id: id });

    if (!vipTicket)
      throw new AppError(400, "Vip Ticket not exists in system", 400);

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
      status = constants.COMMON_STATUS.ACTIVE,
    } = req.body;

    if (
      typeof price != "number" ||
      typeof duration != "number" ||
      typeof coinExtra != "number" ||
      typeof expExtra != "number" ||
      typeof expExtraDaily != "number" ||
      typeof coinExtraDaily != "number" ||
      typeof priority != "number"
    )
      throw new AppError(400, "Bad Request", 400);

    if (duration % (1000 * 60 * 60 * 24) != 0)
      throw new AppError(400, "Invalid duration", 400);

    const createdVipTicket = await VipTicket.create({
      price,
      duration,
      coinExtra,
      expExtra,
      expExtraDaily,
      coinExtraDaily,
      priority,
      status,
      image,
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
};
