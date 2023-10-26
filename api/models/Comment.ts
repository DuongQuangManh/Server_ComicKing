/**
 * Comment.ts
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

    sender: { model: 'user' },

    avatarFrame: { type: 'string' },

    avatarTitle: { type: 'string' },

    level: { type: 'number' },

    vip: { type: 'number' },

    chapter: { model: 'chapter', },

    comment: { model: 'comment' },

    comic: { model: 'comic', required: true },

    content: { type: 'string', required: true },

    numOfLike: { type: 'number', defaultsTo: 0 },

    numOfComment: { type: 'number', defaultsTo: 0 },

    canContainComment: { type: 'boolean', defaultsTo: true },

    status: { type: 'string', defaultsTo: constants.COMMON_STATUS.ACTIVE },

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝


    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

  },

};

