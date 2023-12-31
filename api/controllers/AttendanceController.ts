/**
 * AttendanceController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import moment from "moment";
import { constants } from "../constants/constants";
import { AppError } from "../custom/customClass";
import tryCatch from "../utils/tryCatch";
import { getStartOfDayTimestamp } from "../services";
import { helper } from "../utils/helper";

declare const Attendance: any;
declare const UserWallet: any;
declare const User: any;
declare const UserAttendance: any;

module.exports = {
  adminFind: tryCatch(async (req, res) => {
    const { limit = 10, skip = 0 } = req.body;

    const getCountAttendancePromise = Attendance.count({});
    const getListAttendancePromise = Attendance.find({
      limit,
      skip,
    }).sort("createdAt DESC");

    const [total, listAttendance] = await Promise.all([
      getCountAttendancePromise,
      getListAttendancePromise,
    ]);

    listAttendance?.map((item, index) => {
      item.createdAt = helper.convertToStringDate(item.createdAt);
    });

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: listAttendance,
      limit,
      skip,
      total,
    });
  }),

  add: tryCatch(async (req, res) => {
    const { index, coinExtra, expExtra, priority } = req.body;
    if (
      isNaN(index) ||
      isNaN(coinExtra) ||
      isNaN(expExtra) ||
      expExtra < 0 ||
      coinExtra < 0
    )
      throw new AppError(400, "Bad Request", 400);

    const checkAttendance = await Attendance.findOne({ index });
    if (checkAttendance)
      throw new AppError(400, "Attendance is already exitsts in sytem.", 400);

    const label = constants.ATTENDANCE[index];
    if (!label) {
      throw new AppError(400, "Invalid attendance index.", 400);
    }
    const createdAttendance = await Attendance.create({
      label,
      index,
      coinExtra,
      expExtra,
      priority,
    }).fetch();
    if (!createdAttendance)
      throw new AppError(400, "Cannot create Attendance pls try again.", 400);

    return res.status(200).json({
      message: "Success",
      err: 200,
    });
  }),

  edit: tryCatch(async (req, res) => {
    const {
      id,
      coinExtra,
      expExtra,
      priority,
      status = constants.COMMON_STATUS.ACTIVE,
    } = req.body;
    if (
      isNaN(coinExtra) ||
      isNaN(expExtra) ||
      expExtra < 0 ||
      coinExtra < 0 ||
      !id
    )
      throw new AppError(400, "Bad Request", 400);

    const checkAttendance = await Attendance.findOne({ id });
    if (!checkAttendance)
      throw new AppError(400, "Attendance is not exists in system.", 400);

    const updateAttendance = await Attendance.updateOne({ id }).set({
      coinExtra,
      expExtra,
      priority,
      status,
    });
    if (!updateAttendance)
      throw new AppError(400, "Cannot update Attendance pls try again.", 400);

    return res.status(200).json({
      message: "Success",
      err: 200,
    });
  }),

  adminDetail: tryCatch(async (req, res) => {
    const { attendanceId } = req.body;
    if (!attendanceId) throw new AppError(400, "Bad Request", 400);

    const checkAttendance = await Attendance.findOne({ id: attendanceId });
    if (!checkAttendance)
      throw new AppError(400, "Attendance is not exists in system.", 400);

    checkAttendance.createdAt = helper.convertToStringDate(
      checkAttendance.createdAt
    );
    checkAttendance.updatedAt = helper.convertToStringDate(
      checkAttendance.updatedAt
    );

    return res.status(200).json({
      message: "Success",
      err: 200,
      data: checkAttendance,
    });
  }),

  // api/user/findAttendance
  clientFind: tryCatch(async (req, res) => {
    const { userId } = req.body;

    const nth = moment().day();
    if (!constants.ATTENDANCE[nth])
      throw new AppError(
        400,
        "Can't dayily attendance now. Pls try again",
        400
      );

    const getUserPromise = userId
      ? User.findOne({ where: { id: userId }, select: [] })
      : null;
    const getUserWalletPromise = userId
      ? UserWallet.findOne({ where: { user: userId } })
      : null;
    const getUserAttendancePromise = userId
      ? UserAttendance.findOne({
          where: { user: userId },
          select: ["startWeekTime", "attendances"],
        })
      : null;
    const getListAttendancePromise = Attendance.find({
      select: ["label", "index", "coinExtra", "expExtra", "priority"],
    }).sort([{ priority: "DESC" }, { createdAt: "ASC" }]);

    let [user, userAttendance, listAttendance, userWallet] = await Promise.all([
      getUserPromise,
      getUserAttendancePromise,
      getListAttendancePromise,
      getUserWalletPromise,
    ]);
    if (!userAttendance && user) {
      userAttendance = await UserAttendance.create({ user: userId }).fetch();
    }
    const coinExtraDaily = userWallet?.ticket?.coinExtraDaily || 0;
    const expExtraDaily = userWallet?.ticket?.expExtraDaily || 0;

    if (userAttendance?.attendances) {
      const { startWeekTime = 0, attendances } = userAttendance;
      const startThisWeekTime = getStartOfDayTimestamp(1);
      let isReset = false;
      if (startThisWeekTime - startWeekTime >= 1000 * 60 * 60 * 24 * 7) {
        await UserAttendance.updateOne({ id: userAttendance.id }).set({
          startWeekTime: startThisWeekTime,
          attendances: [],
        });
        isReset = true;
      }
      listAttendance.forEach((attendance) => {
        attendance.coinExtraDaily = coinExtraDaily;
        attendance.expExtraDaily = expExtraDaily;
        if (attendance.index != nth) {
          if (attendance.index > nth || attendance.index == 0) {
            attendance.canAttendance = false;
          } else {
            attendance.isExpired = true;
          }
        } else {
          attendance.canAttendance = true;
          attendance.isCurrentDay = true;
        }
        if (isReset) {
          attendance.isAttened = false;
        } else {
          if (attendances.includes(attendance.index)) {
            attendance.isAttened = true;
            attendance.canAttendance = false;
          }
        }
      });
    }

    return res.status(300).json({
      message: "Success",
      err: 200,
      data: listAttendance,
    });
  }),
};
