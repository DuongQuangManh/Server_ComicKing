/**
 * RankController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { constants } from "../constants/constants";
import { getDateRangeByTimeline } from "../services";
import tryCatch from "../utils/tryCatch";

declare const sails: any;
declare const User: any;

const db = sails.getDatastore().manager;

module.exports = {
  getRankHotComic: tryCatch(async (req, res) => {
    const listComic = await db
      .collection("comic")
      .aggregate([
        {
          $lookup: {
            from: "author",
            localField: "author",
            foreignField: "_id",
            as: "author",
          },
        },
        {
          $unwind: "$author",
        },
        {
          $sort: { numOfView: -1, numOfLike: -1 },
        },
        {
          $skip: 0,
        },
        {
          $limit: 30,
        },
        {
          $project: {
            id: "$_id",
            image: 1,
            name: 1,
            description: 1,
            numOfView: 1,
            author: "$author.name",
          },
        },
      ])
      .toArray();

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: listComic,
    });
  }),

  getRankNewComic: tryCatch(async (req, res) => {
    const listComic: any[] = await db
      .collection("comic")
      .aggregate([
        {
          $lookup: {
            from: "author",
            localField: "author",
            foreignField: "_id",
            as: "author",
          },
        },
        {
          $unwind: "$author",
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $skip: 0,
        },
        {
          $limit: 30,
        },
        {
          $project: {
            id: "$_id",
            image: 1,
            name: 1,
            description: 1,
            numOfView: 1,
            author: "$author.name",
          },
        },
      ])
      .toArray();

    listComic.sort((a, b) => {
      if (a.numOfView > b.numOfView) {
        return -1;
      }
      if (a.numOfView < b.numOfView) {
        return 1;
      }
      return 0;
    });

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: listComic,
    });
  }),

  getRankDoneComic: tryCatch(async (req, res) => {
    const listComic: any[] = await db
      .collection("comic")
      .aggregate([
        {
          $lookup: {
            from: "author",
            localField: "author",
            foreignField: "_id",
            as: "author",
          },
        },
        {
          $unwind: "$author",
        },
        {
          $match: { status: constants.COMIC_STATUS.DONE },
        },
        {
          $skip: 0,
        },
        {
          $limit: 30,
        },
        {
          $project: {
            id: "$_id",
            image: 1,
            name: 1,
            description: 1,
            numOfView: 1,
            author: "$author.name",
          },
        },
      ])
      .toArray();

    listComic.sort((a, b) => {
      if (a.numOfView > b.numOfView) {
        return -1;
      }
      if (a.numOfView < b.numOfView) {
        return 1;
      }
      return 0;
    });

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: listComic,
    });
  }),

  getRankUserLevel: tryCatch(async (req, res) => {
    const listUser = await db
      .collection("user")
      .aggregate([
        {
          $lookup: {
            from: "decorate",
            localField: "avatarFrame",
            foreignField: "_id",
            as: "avatarFrame",
          },
        },
        {
          $unwind: "$avatarFrame",
        },
        {
          $lookup: {
            from: "decorate",
            localField: "avatarTitle",
            foreignField: "_id",
            as: "avatarTitle",
          },
        },
        {
          $unwind: "$avatarTitle",
        },
        {
          $sort: { levelPoint: -1 },
        },
        {
          $limit: 30,
        },
        {
          $project: {
            id: "$_id",
            image: 1,
            fullName: 1,
            avatarFrame: "$avatarFrame.image",
            avatarTitle: "$avatarTitle.image",
          },
        },
      ])
      .toArray();

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: listUser,
    });
  }),

  getRankUserPurchase: tryCatch(async (req, res) => {
    const listUser = await db
      .collection("user")
      .aggregate([
        {
          $lookup: {
            from: "decorate",
            localField: "avatarFrame",
            foreignField: "_id",
            as: "avatarFrame",
          },
        },
        {
          $unwind: "$avatarFrame",
        },
        {
          $lookup: {
            from: "decorate",
            localField: "avatarTitle",
            foreignField: "_id",
            as: "avatarTitle",
          },
        },
        {
          $unwind: "$avatarTitle",
        },
        {
          $sort: { levelPoint: -1 },
        },
        {
          $limit: 30,
        },
        {
          $project: {
            id: "$_id",
            image: 1,
            fullName: 1,
            avatarFrame: "$avatarFrame.image",
            avatarTitle: "$avatarTitle.image",
          },
        },
      ])
      .toArray();

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: listUser,
    });
  }),
};
