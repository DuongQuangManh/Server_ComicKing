/**
 * AttendanceController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { constants } from "../constants/constants";
import { AppError } from "../custom/customClass";
import tryCatch from "../utils/tryCatch";

declare const Attendance: any;

module.exports = {
  adminFind: tryCatch(async (req, res) => {}),

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
    const { id, coinExtra, expExtra, priority } = req.body;
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
    });
    if (!updateAttendance)
      throw new AppError(400, "Cannot update Attendance pls try again.", 400);

    return res.status(200).json({
      message: "Success",
      err: 200,
    });
  }),

  adminDetail: tryCatch(async (req, res) => {
    const { id } = req.body;
    if (!id) throw new AppError(400, "Bad Request", 400);

    const checkAttendance = await Attendance.findOne({ id });
    if (!checkAttendance)
      throw new AppError(400, "Attendance is not exists in system.", 400);

    return res.status(200).json({
      message: "Success",
      err: 200,
      data: checkAttendance,
    });
  }),

  // api/user/findAttendance
  clientFind: tryCatch(async (req, res) => {
    const listAttendance = await Attendance.find({
      select: ["label", "index", "coinExtra", "expExtra", "priority"],
    }).sort("priority desc");

    return res.status(300).json({
      message: "Success",
      err: 200,
      data: listAttendance,
    });
  }),
};
