/**
 * LevelController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { AppError } from "../custom/customClass";
import { helper } from "../utils/helper";
import tryCatch from "../utils/tryCatch";

declare const Level: any;
declare const User: any;
declare const UserWallet: any;

module.exports = {
  adminFind: tryCatch(async (req, res) => {
    const { limit = 10, skip = 0 } = req.body;

    const getCountLevelPromise = Level.count({});
    const getListLevelPromise = Level.find({
      limit,
      skip,
    }).sort("createdAt DESC");

    const [total, listLevel] = await Promise.all([
      getCountLevelPromise,
      getListLevelPromise,
    ]);

    listLevel?.map((item) => {
      item.createdAt = helper.convertToStringDate(item.createdAt);
      item.updatedAt = helper.convertToStringDate(item.updatedAt);
    });

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: listLevel,
      limit,
      skip,
      total,
    });
  }),

  add: tryCatch(async (req, res) => {
    const { index, point = 0 } = req.body;
    if (
      typeof index != "number" ||
      index <= 0 ||
      point <= 0 ||
      typeof point != "number"
    )
      throw new AppError(400, "Bad Request", 400);

    const checkLevelContainPromise = Level.find({
      where: { index: { ">=": index } },
      limit: 1,
    });
    const previousIndex = index - 1;
    if (previousIndex >= 1) {
      var checkPreviousContainPromise = Level.findOne({
        where: { index: previousIndex },
      });
    }
    const [checkLevelContain, checkPreviousContain] = await Promise.all([
      checkLevelContainPromise,
      checkPreviousContainPromise,
    ]);
    if (checkLevelContain?.[0])
      throw new AppError(400, `Level ${index} had contain in system`, 400);
    if (!checkPreviousContain && previousIndex >= 1) {
      throw new AppError(400, `Pls add Level ${previousIndex} before.`, 400);
    } else if (checkPreviousContain) {
      if (point <= checkPreviousContain?.point) {
        throw new AppError(
          400,
          `Required Level poin > Level ${previousIndex} `,
          400
        );
      }
    }

    const createLevelPromise = Level.create({
      point,
      index,
      title: `Level ${index}`,
    }).fetch();
    const updatePreviousLevelPromise = Level.updateOne({
      index: previousIndex,
    }).set({ nextLevelPoint: point });
    const [createdLevel] = await Promise.all([
      createLevelPromise,
      updatePreviousLevelPromise,
    ]);
    if (!createdLevel)
      throw new AppError(400, "Không thể thêm Level, pls try again", 400);

    return res.json({ err: 200, message: "Success" });
  }),

  edit: tryCatch(async (req, res) => {
    const { point, id } = req.body;
    if (point <= 0 || typeof point != "number" || !id || typeof id != "string")
      throw new AppError(400, "Bad Request", 400);

    const level = await Level.findOne({ id: id });
    let previousLevel = null;
    if (level.index != 1) {
      previousLevel = await Level.findOne({ index: level.index - 1 });
    }
    if (!level) throw new AppError(400, "Level not exists in system", 400);

    if (point >= level.nextLevelPoint && level.nextLevelPoint != -1) {
      throw new AppError(
        400,
        `Current point must < point of level ${level.index + 1}`,
        400
      );
    }
    if (previousLevel && previousLevel?.point >= point) {
      throw new AppError(
        400,
        `Current point must > point of level ${previousLevel.index}`,
        400
      );
    }

    const updateCurrentLevelPromise = Level.updateOne({ id: id }).set({
      point,
    });
    let updatePreviousLevelPromise;
    if (previousLevel) {
      updatePreviousLevelPromise = Level.updateOne({
        id: previousLevel.id,
      }).set({
        nextLevelPoint: point,
      });
    }

    const [updatedLevel] = await Promise.all([
      updateCurrentLevelPromise,
      updatePreviousLevelPromise,
    ]);
    if (!updatedLevel)
      throw new AppError(
        400,
        "Can not update level now, please try again",
        400
      );

    return res.status(200).json({
      err: 200,
      message: "Success",
    });
  }),

  adminDetail: tryCatch(async (req, res) => {
    const { levelId } = req.body;
    if (!levelId || typeof levelId != "string")
      throw new AppError(400, "Bad Request", 400);

    const level = await Level.findOne({ id: levelId });
    if (!level) throw new AppError(400, "Level not exists in system", 400);

    level.createdAt = helper.convertToStringDate(level.createdAt);
    level.updatedAt = helper.convertToStringDate(level.updatedAt);

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: level,
    });
  }),

  // api/user/findLevel
  clientFind: tryCatch(async (req, res) => {
    const { userId } = req.body;
    if (!userId) throw new AppError(400, "Bad Request", 400);

    const getUserWalletPromise = UserWallet.findOne({ user: userId });
    const getListLevelPromise = Level.find({}).sort("index asc");
    const [userWallet, listLevel] = await Promise.all([
      getUserWalletPromise,
      getListLevelPromise,
    ]);
    if (!userWallet) throw new AppError(400, "User not exists in system", 400);
    if (!listLevel)
      throw new AppError(400, "Cannot get list Level. Pls try again.", 400);

    let currentLevelIndex = 1;
    let reachedMax = false;
    for (let i = 0; i < listLevel.length; i++) {
      if (userWallet.exp >= listLevel[i].point) {
        currentLevelIndex = listLevel[i].index;
        if (i == listLevel.length - 1) {
          reachedMax = true;
        }
      }
    }

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: { currentLevelIndex, exp: userWallet.exp, reachedMax, listLevel },
    });
  }),
};
