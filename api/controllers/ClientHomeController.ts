/**
 * ClienHomeController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { constants } from "../constants/constants";
import tryCatch from "../utils/tryCatch";

declare const sails: any;
declare const Comic: any;

const db = sails.getDatastore().manager;

module.exports = {
  getHomeComics: tryCatch(async (req, res) => {}),

  getDoneComics: tryCatch(async (req, res) => {
    const listComic = await db
      .collection("comic")
      .aggregate([
        {
          $match: { status: constants.COMIC_STATUS.DONE },
        },
        {
          $sort: { numOfView: -1, numOfLike: -1, createdAt: -1 },
        },
        {
          $limit: 4,
        },
        {
          $project: {
            id: "$_id",
            image: 1,
            name: 1,
            description: 1,
            numOfFollow: 1,
            numOfLike: 1,
            numOfView: 1,
            numOfChapter: 1,
          },
        },
      ])
      .toArray();

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: listComic,
      canMore: true,
    });
  }),

  getSliderComics: tryCatch(async (req, res) => {
    let limit = 6;

    const sliderComics = await Comic.find({
      limit,
    });

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: {
        title: "",
        canMore: false,
        listComic: sliderComics,
      },
    });
  }),

  getNewestComics: tryCatch(async (req, res) => {
    const listComic = await db
      .collection("comic")
      .aggregate([
        {
          $sort: { createdAt: -1 },
        },
        {
          $limit: 6,
        },
        {
          $project: {
            id: "$_id",
            image: 1,
            name: 1,
            description: 1,
            numOfChapter: 1,
            numOfLike: 1,
            numOfView: 1,
          },
        },
      ])
      .toArray();

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: listComic,
      canMore: true,
    });
  }),

  getHotComic: tryCatch(async (req, res) => {
    const listComic = await db
      .collection("comic")
      .aggregate([
        {
          $sort: { numOfView: -1, numOfLike: -1 },
        },
        {
          $limit: 6,
        },
        {
          $project: {
            id: "$_id",
            image: 1,
            name: 1,
            banner: 1,
          },
        },
      ])
      .toArray();

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: listComic,
      canMore: true,
    });
  }),

  getNewestComicsUpdateChapter: tryCatch(async (req, res) => {
    const listComic = await db
      .collection("comic")
      .aggregate([
        {
          $sort: { updatedChapterAt: -1 },
        },
        {
          $sort: { numOfView: -1, numOfLike: -1, createdAt: -1 },
        },
        {
          $limit: 4,
        },
        {
          $project: {
            id: "$_id",
            image: 1,
            name: 1,
            description: 1,
            numOfFollow: 1,
            numOfLike: 1,
            numOfView: 1,
            numOfChapter: 1,
          },
        },
      ])
      .toArray();

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: listComic,
      canMore: true,
    });
  }),

  getProposeComics: tryCatch(async (req, res) => {
    let limit = 6;

    const proposeComics = await Comic.find({
      limit,
      skip: 2,
    });

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: proposeComics,
    });
  }),
};
