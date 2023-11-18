/**
 * UserWalletController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { AppError } from "../custom/customClass";
import tryCatch from "../utils/tryCatch";

declare const UserWallet: any;
declare const VipTicket: any;
declare const Level: any;

module.exports = {
  getWalletInfo: tryCatch(async (req, res) => {
    const { userId } = req.body;
    if (typeof userId != "string") throw new AppError(400, "Bad Request", 400);

    const userWallet = await UserWallet.findOne({ user: userId });
    if (!userWallet) throw new AppError(400, "Invalid User wallet.", 400);

    let getVipTicketPromise = null;
    let getLevelPromise = null;

    if (userWallet.ticket?.vipTicket) {
      getVipTicketPromise = VipTicket.findOne({
        id: userWallet.ticket?.vipTicket,
      });
    }
    if (typeof userWallet.exp == "number") {
      getLevelPromise = Level.find({
        where: {
          point: { "<=": userWallet.exp },
        },
        limit: 1,
      }).sort("index DESC");
    }
    const [vipTicket, level] = await Promise.all([
      getVipTicketPromise,
      getLevelPromise,
    ]);
    if (vipTicket) {
      userWallet.ticket.vipTicket = vipTicket;
    }
    userWallet.level = level?.[0] ? level[0].index : 0;

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: userWallet,
    });
  }),
};
