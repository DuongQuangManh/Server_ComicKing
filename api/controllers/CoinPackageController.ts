/**
 * CoinPackageController
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

declare const CoinPackage: any;

module.exports = {
  adminFind: tryCatch(async (req, res) => {
    const { limit = 10, skip = 0 } = req.body;

    const getCountCoinPackagePromise = CoinPackage.count({});
    const getListCoinPackagePromise = CoinPackage.find({
      limit,
      skip,
    }).sort("createdAt DESC");

    const [total, listCoinPackage] = await Promise.all([
      getCountCoinPackagePromise,
      getListCoinPackagePromise,
    ]);

    listCoinPackage?.map((item, index) => {
      item.createdAt = helper.convertToStringDate(item.createdAt);
      item.duration = Math.round(item.duration / (1000 * 60 * 60 * 24));
    });

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: listCoinPackage,
      limit,
      skip,
      total,
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
      suggest = false,
    } = req.body;

    console.log(req.body);

    if (
      typeof price != "number" ||
      typeof coin != "number" ||
      typeof exp != "number" ||
      typeof priority != "number" ||
      typeof image != "string"
    )
      throw new AppError(400, "Bad Request", 400);

    const updatedCoinPackage = await CoinPackage.updateOne({ id }).set({
      price,
      coin,
      exp,
      priority,
      status,
      image,
      suggest,
    });

    if (!updatedCoinPackage)
      throw new AppError(400, "Can't update coin package. Pls try again.", 400);

    return res.status(200).json({
      message: "Success",
      err: 200,
    });
  }),

  adminDetail: tryCatch(async (req, res) => {
    const { coinPackageId } = req.body;
    if (typeof coinPackageId != "string" || !coinPackageId)
      throw new AppError(400, "Bad Request", 400);

    const coinPackage = await CoinPackage.findOne({ id: coinPackageId });

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
      typeof priority != "number" ||
      typeof image != "string" ||
      !image
    )
      throw new AppError(400, "Bad Request", 400);

    const uId = uuidV4();
    const { url } = await uploadImage(
      image,
      `${constants.IMAGE_FOLDER.COINPACKAGE}/${uId}`,
      "image"
    );

    const createdCoinPackage = await CoinPackage.create({
      price,
      coin,
      exp,
      image: url,
      priority,
      status,
      suggest,
      uId,
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
      select: ["price", "exp", "coin", "currency", "image", "suggest"],
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
