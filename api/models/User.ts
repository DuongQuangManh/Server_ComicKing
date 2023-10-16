/**
 * User.ts
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

    fullName: { type: 'string', required: true },

    email: { type: 'string', unique: true, isEmail: true, maxLength: 255, },

    fbId: { type: 'string', defaultsTo: '' },

    nickName: { type: 'string', unique: true, maxLength: 32 },

    password: { type: 'string', minLength: 6, maxLength: 255, },

    image: { type: 'string', defaultsTo: 'https://ik.imagekit.io/c7aqey5nn/user/avatar.png' },

    birthday: { type: 'string', defaultsTo: '' },

    gender: { type: 'string', defaultsTo: 'None' },

    status: { type: 'string', defaultsTo: constants.COMMON_STATUS.ACTIVE },

    level: { type: 'number', defaultsTo: 1 },

    uId: { type: 'string', required: true },

    levelPoint: { type: 'number', defaultsTo: 0 },

    vipPoint: { type: 'number', defaultsTo: 0 },

    avatarFrame: { model: 'Decorate'},

    comicFollowing: { type: 'json', columnType: 'array', defaultsTo: [] },

    authorFollowing: { type: 'json', columnType: 'array', defaultsTo: [] }

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝


    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝
  },

};

