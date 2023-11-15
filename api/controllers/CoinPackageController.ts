/**
 * CoinPackageController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { constants } from "../constants/constants";
import { AppError } from "../custom/customClass";
import tryCatch from "../utils/tryCatch";

declare const CoinPackage: any;

module.exports = {
  adminFind: tryCatch(async (req, res) => {
    const { limit = 10, skip = 0 } = req.body;

    const listCoinPackage = await CoinPackage.find({
      limit,
      skip,
    }).sort("createdAt DESC");

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: listCoinPackage,
    });
  }),

  edit: tryCatch(async (req, res) => {
    const {
      price,
      priority,
      coin,
      exp,
      status = constants.COMMON_STATUS.ACTIVE,
      id,
      image,
    } = req.body;

    if (
      typeof price != "number" ||
      typeof coin != "number" ||
      typeof exp != "number" ||
      typeof priority != "number" ||
      typeof image != "string"
    )
      throw new AppError(400, "Bad Request", 400);

    const updatedCoinPackage = await CoinPackage.updateOne({ id })
      .set({
        price,
        coin,
        exp,
        priority,
        status,
        image,
      })
      .fetch();

    if (!updatedCoinPackage)
      throw new AppError(400, "Can't update coin package. Pls try again.", 400);

    return res.status(200).json({
      message: "Success",
      err: 200,
    });
  }),

  adminDetail: tryCatch(async (req, res) => {
    const { id } = req.body;

    const coinPackage = await CoinPackage.findOne({ id: id });

    if (!coinPackage)
      throw new AppError(400, "Vip Ticket not exists in system", 400);

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: coinPackage,
    });
  }),

  add: tryCatch(async (req, res) => {
    const {
      price,
      priority,
      coin,
      exp,
      image,
      status = constants.COMMON_STATUS.ACTIVE,
      suggest = false,
    } = req.body;

    if (
      typeof price != "number" ||
      typeof coin != "number" ||
      typeof exp != "number" ||
      typeof priority != "number"
    )
      throw new AppError(400, "Bad Request", 400);

    const createdCoinPackage = await CoinPackage.create({
      price,
      coin,
      exp,
      image,
      priority,
      status,
      suggest,
    }).fetch();

    if (!createdCoinPackage)
      throw new AppError(400, "Can't create coin package. Pls try again.", 400);

    return res.status(200).json({
      message: "Success",
      err: 200,
    });
  }),

  clientFind: tryCatch(async (req, res) => {
    const { limit = 10, skip = 0 } = req.body;

    const listCoinPackage = await CoinPackage.find({
      where: {
        status: constants.COMMON_STATUS.ACTIVE,
      },
      select: ["price", "exp", "coin", "currency", "image"],
      limit,
      skip,
    }).sort("priority DESC");

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: listCoinPackage,
    });
  }),
};
