/**
 * CategoryController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { constants } from "../constants/constants";
import { AppError } from "../custom/customClass";
import tryCatch from "../utils/tryCatch";
import { ObjectId } from "mongodb";
import moment from "moment";
import { helper } from "../utils/helper";

declare const sails: any;
declare const Category: any;

module.exports = {
  clientFind: tryCatch(async (req, res) => {
    const listCategory = await Category.find({
      where: {
        status: constants.COMMON_STATUS.ACTIVE,
      },
    });

    return res.status(200).json({
      message: "Success",
      err: 200,
      data: listCategory,
    });
  }),

  adminFind: tryCatch(async (req, res) => {
    const { limit = 10, skip = 0 } = req.body;

    const findOption = {
      limit,
      skip,
    };

    const total = await Category.count({});
    const categories = await Category.find({
      select: ["title", "updatedAt", "numOfComic", "status", "createdAt"],
      ...findOption,
    }).sort("createdAt desc");

    for (let category of categories) {
      category.createdAt = helper.convertToStringDate(category.createdAt);
      category.updatedAt = helper.convertToStringDate(category.updatedAt);
    }

    return res.status(200).json({
      message: "Find Success",
      err: 200,
      data: categories,
      total,
      ...findOption,
    });
  }),

  add: tryCatch(async (req, res) => {
    const {
      title,
      description,
      status = constants.COMMON_STATUS.ACTIVE,
    } = req.body;
    if (!title || !description) throw new AppError(400, "Bad Request", 400);

    const category = await Category.create({
      title,
      description,
      status,
    }).fetch();

    return res.status(200).json({
      message: "Add success",
      err: 200,
      data: category,
    });
  }),

  edit: tryCatch(async (req, res) => {
    const {
      id,
      title,
      description,
      status = constants.COMMON_STATUS.ACTIVE,
    } = req.body;
    if (!id || !title || !description)
      throw new AppError(400, "Bad Request", 400);

    const category = await Category.updateOne({ id }).set({
      title,
      description,
      status,
    });
    if (!category)
      throw new AppError(
        400,
        "Can not update category now, pls try again",
        400
      );

    return res.status(200).json({
      message: "Update success",
      err: 200,
      data: category,
    });
  }),

  getListComic: tryCatch(async (req, res) => {
    const { categoryId, skip = 0, limit = 15, sort = "hot" } = req.body;
    if (typeof categoryId != "string")
      throw new AppError(400, "Bad Request", 400);

    const db = sails.getDatastore().manager;
    const listComic = await db
      .collection("comic")
      .aggregate([
        {
          $lookup: {
            from: "comiccategory",
            localField: "_id",
            foreignField: "comic",
            as: "categories",
          },
        },
        {
          $match: { "categories.category": ObjectId(categoryId) },
        },
        {
          $sort:
            sort == "hot"
              ? { numOfView: -1, numOfLike: -1 }
              : { createdAt: -1 },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
        {
          $project: {
            id: "$_id",
            name: 1,
            image: 1,
            description: 1,
            numOfComment: 1,
            numOfLike: 1,
            numOfChapter: 1,
            numOfView: 1,
            createdAt: 1,
            updatedChapterAt: 1,
          },
        },
      ])
      .toArray();

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: listComic,
      skip,
      limit,
    });
  }),

  detail: tryCatch(async (req, res) => {
    const { id } = req.body;
    if (!id) {
      throw new AppError(400, "Bad Request", 400);
    }

    let category = await Category.findOne({ id });
    category.createdAt = moment(category.createdAt).format(
      constants.DATE_TIME_FORMAT
    );
    category.updatedAt = moment(category.updatedAt).format(
      constants.DATE_TIME_FORMAT
    );

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: category,
    });
  }),
};
