/**
 * PendingController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { constants } from "../constants/constants";
import { AppError } from "../custom/customClass";
import tryCatch from "../utils/tryCatch";

declare const Category: any;
declare const Author: any;
declare const VipTicket: any;

module.exports = {
  getComicPendingData: tryCatch(async (req, res) => {
    const categories = await Category.find({
      select: ["title"],
    });
    const authors = await Author.find({
      select: ["name"],
    });

    const pendingData = {
      categories,
      authors,
    };

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: pendingData,
    });
  }),

  getCategories: tryCatch(async (req, res) => {
    const categories = await Category.find({
      select: ["title"],
    });

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: categories,
    });
  }),

  getAuthors: tryCatch(async (req, res) => {
    const authors = await Author.find({
      where: {
        status: constants.COMMON_STATUS.ACTIVE,
      },
      select: ["name"],
    });

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: authors,
    });
  }),

  getVipTicket: tryCatch(async (req, res) => {
    const listVipTicket = await VipTicket.find({
      where: {
        status: constants.COMMON_STATUS.ACTIVE,
      },
      select: ["name"],
    });
    if (!listVipTicket)
      throw new AppError(400, "Cannot get list Vip Ticket", 400);

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: listVipTicket,
    });
  }),
};
