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

    categories: { collection: 'category', via: 'comic', through: 'comiccategory' },

    author: { model: 'author' },

    numOfChapter: { type: 'number', defaultsTo: 0 },

    status: { type: 'string', defaultsTo: constants.COMIC_STATUS.IN_PROCESS },

    numOfFollow: { type: 'number', defaultsTo: 0 },

    image: { type: 'string', defaultsTo: '' },

    banner: { type: 'string', defaultsTo: 'https://ik.imagekit.io/c7aqey5nn/banner/banner1.png' },

    numOfComment: { type: 'number', defaultsTo: 0 },

    numOfView: { type: 'number', defaultsTo: 0 },

    isHot: { type: 'boolean', defaultsTo: false },

    uId: { type: 'string', required: true },

    chapters: { collection: 'chapter', via: 'comic' },

    star: { type: 'number', defaultsTo: 0 },

    numOfRate: { type: 'number', defaultsTo: 0 },

    publishedAt: { type: 'number', defaultsTo: 0 },

    numOfLike: { type: 'number', defaultsTo: 0 },

    updatedChapterAt: { type: 'number', defaultsTo: Date.now() },

    lastChapterIndex: { type: 'number', defaultsTo: 0 }

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝


    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

  },

};

