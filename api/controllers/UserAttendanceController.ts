/**
 * UserAttendanceController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import moment from "moment";
import { constants } from "../constants/constants";
import { AppError } from "../custom/customClass";
import tryCatch from "../utils/tryCatch";
import { getStartOfDayTimestamp } from "../services";

declare const UserWallet: any;
declare const Attendance: any;
// declare const VipTicket: any;
declare const UserAttendance: any;

module.exports = {
  // api/user/dailyAttendance
  dailyAttendance: tryCatch(async (req, res) => {
    const { userId } = req.body;
    if (typeof userId != "string") throw new AppError(400, "Bad request", 400);

    const checkUserWallet = await UserWallet.findOne({
      where: {
        user: userId,
      },
      select: ["coin", "ticket", "exp"],
    });
    if (!checkUserWallet)
      throw new AppError(400, "User wallet not exists in system.", 400);

    const nth = moment().day();
    if (!constants.ATTENDANCE[moment().day()])
      throw new AppError(
        400,
        "Can't dayily attendance now. Pls try again",
        400
      );

    const getAttendancePromise = Attendance.findOne({ index: nth });
    const getUserAttendancePromise = UserAttendance.findOne({ user: userId });
    // const getVipTicketPromise = checkUserWallet.ticket?.vipTicket
    //   ? VipTicket.findOne({
    //       where: { id: checkUserWallet.ticket.vipTicket },
    //       select: ["extraCoinDaily", "expExtra"],
    //     })
    //   : null;
    const [attendance, userAttendance] = await Promise.all([
      getAttendancePromise,
      getUserAttendancePromise,
      // getVipTicketPromise,
    ]);
    if (!attendance)
      throw new AppError(
        400,
        "Can't dayily attendance now. Pls try again",
        400
      );
    if (!userAttendance)
      throw new AppError(400, "Your account cannot attendance.", 400);
    if (!checkUserWallet)
      throw new AppError(400, "You don't have permisition to attendance.", 400);
    if (userAttendance.attendances?.includes(nth))
      throw new AppError(400, "You already attened today.", 400);

    userAttendance.attendances?.push(nth);
    const isExpired = Date.now() - checkUserWallet.ticket?.expiredAt > 0;
    let coinExtra =
      attendance.coinExtra +
      (!checkUserWallet || isExpired
        ? 0
        : checkUserWallet.ticket?.coinExtraDaily || 0);
    let expExtra =
      attendance.expExtra +
      (!checkUserWallet || isExpired
        ? 0
        : checkUserWallet.ticket?.expExtraDaily);

    const updateUserWalletPromise = UserWallet.updateOne({
      id: checkUserWallet.id,
    }).set({
      coin: checkUserWallet.coin + coinExtra,
      exp: checkUserWallet.exp + expExtra,
    });
    const updateUserAttendancePromise = UserAttendance.updateOne({
      id: userAttendance.id,
    }).set({
      attendances: userAttendance.attendances,
      startWeekTime: getStartOfDayTimestamp(1),
    });
    await Promise.all([updateUserAttendancePromise, updateUserWalletPromise]);

    return res.status(200).json({
      err: 200,
      message: "Success",
    });
  }),
};
