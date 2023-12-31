/**
 * ComicController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { constants } from "../constants/constants";
import { AppError } from "../custom/customClass";
import { uploadImage } from "../imagekit";
import tryCatch from "../utils/tryCatch";
import { v4 as uuidV4 } from "uuid";
import { helper } from "../utils/helper";
import { handleIncNumPromise } from "../services";
import { getSortObject } from "../services/ComicService";
import { ObjectId } from "mongodb";
import { sendMutipleNotification } from "../../config/firebase/firebase";

declare const sails: any;
declare const Comic: any;
declare const ComicCategory: any;
declare const Chapter: any;
declare const Author: any;
declare const Category: any;
declare const InteractComic: any;
declare const User: any;
declare const Comment: any;
declare const Notification: any;

module.exports = {
  adminFind: tryCatch(async (req, res) => {
    const { skip = 0, limit = 20 } = req.body;
    const findOption = { skip, limit };

    const [total, listComic] = await Promise.all([
      Comic.count({}),
      Comic.find({
        ...findOption,
        select: [
          "name",
          "createdAt",
          "publishedAt",
          "updatedChapterAt",
          "publishedAt",
          "numOfChapter",
          "numOfFollow",
          "numOfView",
          "star",
          "numOfLike",
          "status",
        ],
      }).sort("createdAt desc"),
    ]);

    for (let comic of listComic) {
      comic.createdAt = helper.convertToStringDate(comic.createdAt);
      comic.updatedChapterAt = helper.convertToStringDate(
        comic.updatedChapterAt,
        constants.DATE_FORMAT
      );
      comic.publishedAt = helper.convertToStringDate(
        comic.publishedAt,
        constants.DATE_FORMAT
      );
    }

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: listComic,
      total,
      ...findOption,
    });
  }),

  add: tryCatch(async (req, res) => {
    const {
      image,
      name,
      description,
      author,
      publishedAt,
      status,
      categories,
    } = req.body;
    if (
      !image ||
      !name ||
      !description ||
      !author ||
      !publishedAt ||
      !Array.isArray(categories)
    )
      throw new AppError(400, "Bad Request", 400);
    if (categories.length > 10)
      throw new AppError(400, "Vui lòng giảm bớt thể loại (giới hạn 10).", 400);

    const uId = uuidV4();
    const { url } = await uploadImage(
      image,
      `${constants.IMAGE_FOLDER.COMIC}/${uId}/avatar`,
      "avatar"
    );

    const getUserFollowingAuthorPromise = User.find({
      where: {
        authorFollowing: {
          contains: author,
        },
      },
      select: ["deviceToken"],
    });
    const getAuthorPromise = Author.findOne({
      where: { id: author },
      select: ["name", "image"],
    });
    const createComicPromise = Comic.create({
      name,
      description,
      author,
      image: url,
      uId,
      status,
      publishedAt: helper.convertToTimeStamp(publishedAt),
    }).fetch();
    const [createdComic, listUser, checkAuthor] = await Promise.all([
      createComicPromise,
      getUserFollowingAuthorPromise,
      getAuthorPromise,
    ]);
    if (!createdComic)
      throw new AppError(
        400,
        "Không thể khởi tạo Comic vui lòng thử lại.",
        400
      );

    let listDeviceToken: string[] = [];
    let listUserId: string[] = [];
    let listNotificationObj: any[] = [];
    for (let user of listUser) {
      if (user.deviceToken) {
        listDeviceToken.push(user.deviceToken);
      }
      if (user.id) {
        listUserId.push(user.id);
      }
      listNotificationObj.push({
        title: "Truyện mới",
        tag: "system",
        image: checkAuthor.image,
        content: `${checkAuthor?.name} vừa ra mắt bộ truyện ${name}`,
        action: constants.NOTIFICATION_ACTION.NEW_COMIC,
        receiver: user.id,
        data: {
          comic: createdComic.id,
          author,
        },
      });
    }

    const createEachNotificationPromise =
      Notification.createEach(listNotificationObj);
    const sendNotificationPromise = sendMutipleNotification(listDeviceToken, {
      title: "Truyện mới",
      body: `${checkAuthor.name} vừa ra mắt bộ truyện ${name}`,
    });
    const incrementCountNotificationPromise = handleIncNumPromise(
      listUserId,
      "user",
      1,
      "countNewNotification"
    );
    Promise.all([
      Comic.addToCollection(createdComic.id, "categories", [
        ...new Set(categories),
      ]),
      Author.updateOne({ id: author }).set({ updatedComicAt: Date.now() }),
      handleIncNumPromise(author, "author", 1, "numOfComic"),
      handleIncNumPromise(categories, "category", 1, "numOfComic"),
      createEachNotificationPromise,
      sendNotificationPromise,
      incrementCountNotificationPromise,
    ]);

    return res.status(200).json({ err: 200, message: "Thêm thành công" });
  }),

  edit: tryCatch(async (req, res) => {
    const {
      id,
      image,
      name,
      description,
      author,
      publishedAt,
      status,
      categories,
    } = req.body;
    if (
      !name ||
      !description ||
      !author ||
      !publishedAt ||
      !Array.isArray(categories)
    )
      throw new AppError(400, "Bad Request", 400);
    if (categories.length > 10)
      throw new AppError(400, "Vui lòng giảm bớt thể loại (giới hạn 10).", 400);

    const checkComic = await Comic.findOne({ id });
    if (!checkComic)
      throw new AppError(400, "Truyện không tồn tại vui lòng thử lại.", 400);

    if (image && checkComic.image != image) {
      var { url } = await uploadImage(
        image,
        `${constants.IMAGE_FOLDER.COMIC}/${checkComic.uId}`,
        "avatar"
      );
    }
    const updateComicPromise = Comic.updateOne({ id }).set({
      name,
      description,
      author,
      status,
      image: url ?? checkComic.image,
      publishedAt: helper.convertToTimeStamp(publishedAt),
    });
    const getBeforeCategory = ComicCategory.find({
      where: { comic: id },
      select: ["category"],
    });
    const [beforeCategoryObj, updatedComic] = await Promise.all([
      getBeforeCategory,
      updateComicPromise,
    ]);
    if (!updatedComic)
      throw new AppError(400, "Không cập nhật Comic vui lòng thử lại.", 400);

    if (beforeCategoryObj) {
      // advoid duplicate category id
      const beforeCategorySet = new Set(
        beforeCategoryObj.map((item: any) => item.category) as string[]
      );
      const updateCategorySet = new Set(categories);
      // filter categories need remove or add
      const categoriesNeedRemove = [...beforeCategorySet].filter(
        (item) => !updateCategorySet.has(item)
      );
      const categoriesNeedAdd = [...updateCategorySet].filter(
        (item) => !beforeCategorySet.has(item)
      );

      const handleAddCategoriesPromise =
        categoriesNeedAdd.length > 0
          ? Promise.all([
              Comic.addToCollection(
                updatedComic.id,
                "categories",
                categoriesNeedAdd
              ),
              handleIncNumPromise(
                categoriesNeedAdd,
                "category",
                1,
                "numOfComic"
              ),
            ])
          : null;
      const handleRemoveCategoriesPromise =
        categoriesNeedRemove.length > 0
          ? Promise.all([
              Comic.removeFromCollection(
                updatedComic.id,
                "categories",
                categoriesNeedRemove
              ),
              handleIncNumPromise(
                categoriesNeedRemove,
                "category",
                -1,
                "numOfComic"
              ),
            ])
          : null;
      // const comicAddCategoriesPromise = Comic.addToCollection(updatedComic.id, 'categories', categoriesNeedAdd)
      // const comicRemoveCategoriesPromise = Comic.removeFromCollection(updatedComic.id, 'categories', categoriesNeedRemove)
      const updateNumComicOfAuthorPromise = () => {
        if (updatedComic.author != checkComic.author) {
          return Promise.all([
            handleIncNumPromise(updatedComic.author, "author", 1, "numOfComic"),
            handleIncNumPromise(checkComic.author, "author", -1, "numOfComic"),
          ]);
        }
      };
      Promise.all([
        handleAddCategoriesPromise,
        handleRemoveCategoriesPromise,
        updateNumComicOfAuthorPromise,
      ]);
    }

    return res.status(200).json({ err: 200, message: "Cập nhật thành công" });
  }),

  adminDetail: tryCatch(async (req, res) => {
    const { id, requestType } = req.body;

    let comic: any;
    const getComicPromise = Comic.findOne({ id });
    const getListComicCategory = ComicCategory.find({
      where: { comic: id },
      select: ["category"],
    });
    const [comicDetail, listComicCategory] = await Promise.all([
      getComicPromise,
      getListComicCategory,
    ]);
    if (requestType == "update") {
      comic = {
        ...comicDetail,
        categories: listComicCategory?.map((item: any) => item.category),
      };
    } else {
      const listCategoryId = listComicCategory?.map(
        (item: any) => item.category
      );
      const getAuthorPromise = Author.findOne({ id: comicDetail.author });
      const getListCategoryPromise = Category.find({
        where: { id: { in: listCategoryId } },
        select: ["title"],
      });
      const [author, listCategory] = await Promise.all([
        getAuthorPromise,
        getListCategoryPromise,
      ]);
      comic = {
        ...comicDetail,
        categories: listCategory,
        author,
      };
    }
    if (!comic) throw new AppError(400, "Comic không tồn tại", 400);

    comic.createdAt = helper.convertToStringDate(comic.createdAt);
    comic.updatedAt = helper.convertToStringDate(comic.updatedAt);
    comic.publishedAt = helper.convertToStringDate(
      comic.publishedAt,
      constants.DATE_FORMAT
    );

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: comic,
    });
  }),

  clientFind: tryCatch(async (req, res) => {
    const {
      skip = 0,
      limit = 15,
      sort = "hot",
      name = "",
      status = "",
    } = req.body;

    const db = sails.getDatastore().manager;
    const listComic = await db
      .collection("comic")
      .aggregate([
        {
          $match: {
            name: { $regex: new RegExp(`${name.trim()}`, "im") },
            status: { $regex: new RegExp(`${status.trim()}`, "im") },
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
        {
          $sort: getSortObject(sort),
        },
        {
          $project: {
            id: "$_id",
            description: 1,
            numOfLike: 1,
            numOfFollow: 1,
            numOfComment: 1,
            numOfChapter: 1,
            name: 1,
            createdAt: 1,
            updatedChapterAt: 1,
            image: 1,
            numOfView: 1,
          },
        },
      ])
      .toArray();

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: listComic,
      skip,
      limit,
    });
  }),

  clientDetail: tryCatch(async (req, res) => {
    const { comicId, userId } = req.body;
    const db = sails.getDatastore().manager;
    if (!comicId) throw new AppError(400, "Bad Request", 400);

    const comicDetailPromise = db
      .collection("comic")
      .aggregate([
        {
          $match: { _id: ObjectId(comicId) },
        },
        {
          $lookup: {
            from: "author",
            localField: "author",
            foreignField: "_id",
            as: "author",
          },
        },
        {
          $unwind: "$author",
        },
        {
          $project: {
            id: "$_id",
            name: 1,
            numOfView: 1,
            numOfFollow: 1,
            numOfChapter: 1,
            numOfLike: 1,
            numOfComment: 1,
            description: 1,
            image: 1,
            banner: 1,
            author: {
              id: "$author._id",
              name: 1,
              numOfComic: 1,
              image: 1,
              numOfFollow: 1,
            },
          },
        },
      ])
      .toArray();
    // const comicDetailPromise = Comic.findOne({
    //   where: { id: comicId, status: { "!=": constants.COMMON_STATUS.ACTIVE } },
    // }).populate("author");
    const getComicChaptersPromise = Chapter.find({
      where: { comic: comicId, status: constants.COMMON_STATUS.ACTIVE },
      select: ["updatedAt", "numOfView", "numOfComment", "numOfLike", "index"],
    }).sort("index asc");
    const getComicCategoriesPromise = db
      .collection("comiccategory")
      .aggregate([
        {
          $match: { comic: ObjectId(comicId) },
        },
        {
          $lookup: {
            from: "category",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $unwind: "$category",
        },
        {
          $project: {
            id: "$category._id",
            title: "$category.title",
          },
        },
      ])
      .toArray();
    const getHotCommentsPromise = Comment.find({
      where: {
        comic: comicId,
        status: { "!=": constants.COMMON_STATUS.IN_ACTIVE },
      },
      select: [
        "senderInfo",
        "content",
        "numOfComment",
        "numOfLike",
        "sender",
        "createdAt",
        "comic",
      ],
    })
      .sort([{ numOfLike: "DESC" }, { numOfComment: "DESC" }])
      .limit(3);
    let getInteractComicPromise = null;
    let getUserPromise = null;
    if (userId) {
      getInteractComicPromise = InteractComic.findOne({
        where: { user: userId, comic: comicId },
        select: ["likeComments", "readedChapters", "readingChapter"],
      });
      getUserPromise = User.findOne({
        where: { id: userId },
        select: ["authorFollowing", "comicFollowing", "likeMyComments"],
      });
    }

    const [
      [comic],
      chapters,
      categories,
      interactComic,
      checkUser,
      hotComments,
    ] = await Promise.all([
      comicDetailPromise,
      getComicChaptersPromise,
      getComicCategoriesPromise,
      getInteractComicPromise,
      getUserPromise,
      getHotCommentsPromise,
    ]);
    if (!comic)
      throw new AppError(
        400,
        "Comic is not exists in system or wrong data.",
        400
      );

    let { readedChapters, readingChapter, likeComments } = interactComic ?? {};
    const readedChaptersSet = new Set(readedChapters ?? []);
    comic.chapters = chapters?.map((chapter: any) => {
      chapter.isRead = readedChaptersSet.has(chapter.id);
      chapter.updatedAt = helper.convertToStringDate(
        chapter.updatedAt,
        constants.DATE_FORMAT
      );
      return chapter;
    });
    comic.categories = categories;
    if (checkUser) {
      // check following author
      if (comic.author) {
        if (checkUser.authorFollwing?.includes(comic.author.id)) {
          comic.author.isFollwing = true;
        }
      }
      // check following comic
      if (checkUser.comicFollowing?.includes(comic.id.toString())) {
        comic.isFollowing = true;
      }
      // check like comment
      const likeMyCommentsSet = new Set(checkUser.likeMyComments ?? []);
      const likeCommentsSet = new Set(likeComments);
      comic.hotComments = hotComments?.map((comment: any) => {
        if (comment.sender == userId) {
          if (likeMyCommentsSet.has(comment.id)) comment.isLike = true;
        } else {
          if (likeCommentsSet.has(comment.id)) comment.isLike = true;
        }
        return comment;
      });
    }

    comic.readingChapter = readingChapter ?? 0;
    comic.updatedChapterAt = helper.convertToStringDate(
      comic.updatedChapterAt,
      constants.DATE_FORMAT
    );
    comic.publishedAt = helper.convertToStringDate(
      comic.publishedAt,
      constants.DATE_FORMAT
    );

    return res.status(200).json({ err: 200, message: "Success", data: comic });
  }),

  // api/user/comic/getListComment
  getListComment: tryCatch(async (req, res) => {
    const { userId, comicId, skip = 0, limit = 15, sort = "hot" } = req.body;
    if (typeof comicId != "string") throw new AppError(400, "Bad request", 400);

    let getUserPromise = null;
    let getInteractComicPromise = null;
    if (userId) {
      getUserPromise = User.findOne({
        where: { id: userId },
        select: ["likeMyComments"],
      });
      getInteractComicPromise = InteractComic.findOne({
        where: { user: userId, comic: comicId },
      });
    }
    const getListCommentPromise = Comment.find({
      where: {
        comic: comicId,
        status: { "!=": constants.COMMON_STATUS.IN_ACTIVE },
      },
      select: [
        "senderInfo",
        "content",
        "numOfComment",
        "numOfLike",
        "sender",
        "createdAt",
        "comic",
      ],
    })
      .sort(
        sort == "hot"
          ? [{ numOfComment: "DESC" }, { numOfLike: "DESC" }]
          : "createdAt DESC"
      )
      .skip(skip)
      .limit(limit);

    const [user, listComment = [], interactComic] = await Promise.all([
      getUserPromise,
      getListCommentPromise,
      getInteractComicPromise,
    ]);

    let likeCommentsArray = [];
    if (user) likeCommentsArray = [...user.likeMyComments];
    if (interactComic)
      likeCommentsArray = [...likeCommentsArray, ...interactComic.likeComments];
    const likeCommentsSet = new Set(likeCommentsArray);
    for (let comment of listComment) {
      if (likeCommentsSet.has(comment.id)) {
        comment.isLike = true;
      }
    }
    return res.status(200).json({
      err: 200,
      message: "Success",
      data: listComment,
      skip,
      limit,
    });
  }),

  getListChapter: tryCatch(async (req, res) => {
    const { skip = 0, limit = 10, comicId } = req.body;
    if (!comicId) throw new AppError(400, "Bad Request", 400);
    const findOption = { skip, limit };

    const getComicPromise = Comic.findOne({
      where: { id: comicId },
      select: ["lastChapterIndex"],
    });
    const getListChapterPromise = Chapter.find({
      where: {
        comic: comicId,
      },
      ...findOption,
    }).sort("index desc");

    const [listChapter, comic] = await Promise.all([
      getListChapterPromise,
      getComicPromise,
    ]);
    if (!comic) throw new AppError(400, "Comic Not found", 400);

    for (let chapter of listChapter) {
      chapter.createdAt = helper.convertToStringDate(chapter.createdAt);
      chapter.updatedAt = helper.convertToStringDate(chapter.updatedAt);
      chapter.images = chapter.images?.length ?? 0;
    }

    return res.status(200).json({
      err: 200,
      status: "Success",
      data: listChapter,
      ...findOption,
      total: comic.lastChapterIndex || 0,
    });
  }),
};
