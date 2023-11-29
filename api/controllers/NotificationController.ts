/**
 * NotificationController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { sendSingleNotification } from "../../config/firebase/firebase";
import tryCatch from "../utils/tryCatch";

module.exports = {
  add: tryCatch(async (req, res) => {
    // const respone = await sendNotification("", "");
    // return res.json({
    //   err: 200,
    //   message: "Success",
    //   respone,
    // });
  }),
};
