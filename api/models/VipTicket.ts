/**
 * VipTicket.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

import { constants } from "../constants/constants";

module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    priority: { type: "number", defaultsTo: 0 },

    price: { type: "number", required: true },

    duration: { type: "number", required: true },

    coinExtraDaily: { type: "number", defaultsTo: 0 },

    expExtraDaily: { type: "number", defaultsTo: 0 },

    coinExtra: { type: "number", defaultsTo: 0 },

    expExtra: { type: "number", defaultsTo: 0 },

    details: { type: "json", columnType: "array", defaultsTo: [] },

    currency: { type: "string", defaultsTo: "VNĐ" },

    status: { type: "string", defaultsTo: constants.COMMON_STATUS.ACTIVE },

    image: { type: "string", defaultsTo: "" },

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝
    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝
  },
};
