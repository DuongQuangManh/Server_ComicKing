/**
 * TransactionController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { isNonNullChain } from "typescript";
import { constants } from "../constants/constants";
import { AppError } from "../custom/customClass";
import tryCatch from "../utils/tryCatch";

declare const CoinPackage: any;
declare const VipTicket: any;
declare const User: any;
declare const Transaction: any;
declare const UserWallet: any;

module.exports = {
  createCoinPackageTransaction: tryCatch(async (req, res) => {
    const { txnToken, amount, coinPackageId, userId } = req.body;
    if (
      typeof txnToken != "string" ||
      typeof amount != "number" ||
      typeof coinPackageId != "string" ||
      typeof userId != "string"
    )
      throw new AppError(400, "Bad Request", 400);

    const checkUserPromise = User.findOne({
      where: {
        id: userId,
      },
      select: [],
    });
    const checkCoinPackagePromise = CoinPackage.findOne({
      where: {
        id: coinPackageId,
        status: constants.COMMON_STATUS.ACTIVE,
      },
      select: ["coin", "exp", "price", "currency"],
    });
    const [checkUser, checkCoinPackage] = await Promise.all([
      checkUserPromise,
      checkCoinPackagePromise,
    ]);
    if (!checkUser) throw new AppError(400, "Invalid User", 400);
    if (!checkCoinPackage)
      throw new AppError(400, "Coin Package not exists in system", 400);

    if (amount != checkCoinPackage.price)
      throw new AppError(400, "Invalid amount", 400);

    const detailData = {
      tag: "coin",
      ...checkCoinPackage,
    };

    const createdTransaction = await Transaction.create({
      txnToken,
      detail: detailData,
      title: "Giao dịch gói xu.",
      user: userId,
    }).fetch();

    if (!createdTransaction)
      throw new AppError(
        400,
        "Can't not request transaction now. Pls try in later.",
        400
      );

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: {
        txnId: createdTransaction.id,
      },
    });
  }),

  createVipTicketTransaction: tryCatch(async (req, res) => {
    const { txnToken, amount, vipTicketId, userId } = req.body;
    if (
      typeof txnToken != "string" ||
      typeof amount != "number" ||
      typeof vipTicketId != "string" ||
      typeof userId != "string"
    )
      throw new AppError(400, "Bad Request", 400);

    const checkUserPromise = User.findOne({
      where: {
        id: userId,
      },
      select: [],
    });
    const checkVipTicketPromise = VipTicket.findOne({
      where: {
        id: vipTicketId,
        status: constants.COMMON_STATUS.ACTIVE,
      },
      select: [
        "coinExtra",
        "expExtra",
        "coinExtraDaily",
        "expExtraDaily",
        "price",
        "currency",
        "name",
        "duration",
      ],
    });
    const [checkUser, checkVipTicket] = await Promise.all([
      checkUserPromise,
      checkVipTicketPromise,
    ]);
    if (!checkUser) throw new AppError(400, "Invalid User", 400);
    if (!checkVipTicket)
      throw new AppError(400, "Vip Ticket not exists in system", 400);

    if (amount != checkVipTicket.price)
      throw new AppError(400, "Invalid amount", 400);

    const detailData = {
      ...checkVipTicket,
      tag: "ticket",
      duration: checkVipTicket.duration,
    };

    const createdTransaction = await Transaction.create({
      txnToken,
      detail: detailData,
      title: `Giao dịch ${checkVipTicket.name}`,
      user: userId,
    }).fetch();

    if (!createdTransaction)
      throw new AppError(
        400,
        "Can't not request transaction now. Pls try in later.",
        400
      );

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: {
        txnId: createdTransaction.id,
      },
    });
  }),

  requestEndTransaction: tryCatch(async (req, res) => {
    const { txnId, status } = req.body;
    if (typeof txnId != "string" || typeof status != "string")
      throw new AppError(400, "Bad Request", 400);

    const checkTransaction = await Transaction.findOne({
      where: {
        id: txnId,
      },
    });
    if (!checkTransaction)
      throw new AppError(400, "Transaction not found.", 400);

    const updateTransactionPromise = Transaction.updateOne({ id: txnId }).set({
      status: status,
      endedAt: Date.now(),
    });
    const getUserWalletPromise =
      status == constants.TRANSACTION_STATUS.SUCCESS
        ? UserWallet.findOne({
            where: { user: checkTransaction.user },
          })
        : null;
    const [userWallet] = await Promise.all([
      getUserWalletPromise,
      updateTransactionPromise,
    ]);
    if (status == constants.TRANSACTION_STATUS.SUCCESS) {
      if (!userWallet)
        throw new AppError(
          400,
          "Can't find your wallet pls contact 099999999",
          400
        );

      const updateUserWalletBody: any = {
        ticket: {},
      };
      const { detail } = checkTransaction;
      updateUserWalletBody.coin =
        userWallet.coin + (detail.coin || detail.coinExtra);
      updateUserWalletBody.exp =
        userWallet.exp + (detail.exp || detail.expExtra);
      if (detail.tag == "ticket") {
        updateUserWalletBody.ticket.vipTicket = detail.id;
        updateUserWalletBody.ticket.coinExtraDaily = detail.coinExtraDaily;
        updateUserWalletBody.ticket.expExtraDaily = detail.expExtraDaily;
        updateUserWalletBody.ticket.expiredAt = Date.now() + detail.duration;
        console.log("Duration", detail.duration);
      }
      await UserWallet.updateOne({ id: userWallet.id }).set({
        ...updateUserWalletBody,
      });
    }
    return res.status(200).json({
      err: 200,
      message: "Success",
      data: {
        status: status,
        transactionName: checkTransaction.title,
        price: checkTransaction.detail?.price,
      },
    });
  }),
};
