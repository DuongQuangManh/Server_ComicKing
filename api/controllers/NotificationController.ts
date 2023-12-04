/**
 * NotificationController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { sendSingleNotification } from "../../config/firebase/firebase";
import { AppError } from "../custom/customClass";
import { handleIncNumPromise } from "../services";
import tryCatch from "../utils/tryCatch";

declare const Notification: any;

module.exports = {
  add: tryCatch(async (req, res) => {}),

  adminFind: tryCatch(async (req, res) => {}),

  clientDetail: tryCatch(async (req, res) => {
    const { notificationId } = req.body;
    if (typeof notificationId != "string")
      throw new AppError(400, "Bad Request", 400);

    const notification = await Notification.findOne({
      id: notificationId,
    });
    if (!notification) throw new AppError(400, "Invalid Notification", 400);

    if (!notification.isRead && notification.receiver) {
      // const updateCountNewNotificationPromise = handleIncNumPromise(
      //   notification.receiver,
      //   "user",
      //   -1,
      //   "countNewNotification"
      // );
      const updateNotificationPromise = Notification.updateOne({
        id: notificationId,
      }).set({
        isRead: true,
      });
      Promise.all([
        // updateCountNewNotificationPromise,
        updateNotificationPromise,
      ]);
    }

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: notification,
    });
  }),

  adminDetail: tryCatch(async (req, res) => {}),
};
