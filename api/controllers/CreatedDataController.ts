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
declare const sails: any;
declare const UserWallet: any;
declare const Attendance: any;

module.exports = {
  createUserWallet: tryCatch(async (req, res) => {
    const createdData = await UserWallet.createEach([
      {
        user: "651b79c805faa7240416954f",
      },
      {
        user: "652234dcfcfcc82cb0279f0c",
      },
      {
        user: "652294b584de4b2de4fb01d9",
      },
      {
        user: "652297bb78695602a0696b00",
      },
      {
        user: "652bd881d6fd53037039636e",
      },
      {
        user: "652ded34b9d39238c8272be6",
      },
      {
        user: "652e157ef8adb628788fc402",
      },
      {
        user: "653716e614928100337ed1c3",
      },
      {
        user: "653a1ef0f6ed060033d6b3ba",
      },
      {
        user: "653d073a91f577003321d37e",
      },
      {
        user: "653f34aa63d4de5088c02ef9",
      },
      {
        user: "653f780146609900321fde1a",
      },
      {
        user: "6541ae49c573951d88ff5e33",
      },
      {
        user: "6546383dab772b22203775dc",
      },
      {
        user: "65464c8f83b21a27f0c97126",
      },
      {
        user: "654886d56adee400349d7da3",
      },
      {
        user: "6548af1ced69cd05a082228e",
      },
      {
        user: "6548b5deed69cd05a0822290",
      },
      {
        user: "6548b6c7ed69cd05a0822292",
      },
      {
        user: "654ca1502e2f7e30740bc83d",
      },
    ]).fetch();

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: createdData,
    });
  }),
};
