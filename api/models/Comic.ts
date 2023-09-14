/**
 * Comic.ts
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
    name: { type: 'string', required: true },

    description: { type: 'string', required: true },

    categories: { collection: 'category', via: 'comics' },

    author: { model: 'author' },

    numOfChapter: { type: 'number', defaultsTo: 0 },

    status: { type: 'string', defaultsTo: constants.COMIC_STATUS.IN_PROCESS },

    numOfFavorite: { type: 'number', defaultsTo: 0 },

    image: { type: 'string', defaultsTo: '' },

    numOfComment: { type: 'number', defaultsTo: 0 },

    numOfView: { type: 'number', defaultsTo: 0 },

    isHot: { type: 'boolean', defaultsTo: false },

    uId: { type: 'string', required: true },

    chapters: { collection: 'chapter', via: 'comic' },

    specialList: { model: 'specialList' },

    start: { type: 'number', defaultsTo: 0 },

    numOfRate: { type: 'number', defaultsTo: 0 }

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝


    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

  },

};

