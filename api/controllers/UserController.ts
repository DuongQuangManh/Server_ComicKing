/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import moment from "moment";
import { AppError } from "../custom/customClass";
import { uploadImage } from "../imagekit";
import tryCatch from "../utils/tryCatch";
import { updateProfileValidation } from "../validations/user/user.validation";
import { constants } from "../constants/constants";
import { v4 as uuidV4 } from "uuid";
import { hashPassword } from "../services/AuthService";
import { handleIncNumPromise } from "../services";
import { ObjectId } from "mongodb";

declare const sails: any;
declare const User: any;
declare const Chapter: any;
declare const Comic: any;
declare const Author: any;
declare const InteractComic: any;
declare const Decorate: any;
declare const Comment: any;
declare const UserWallet: any;

module.exports = {
  find: tryCatch(async (req, res) => {
    const { skip = 0, limit = 10 } = req.body;
    const findOptions = {
      skip,
      limit,
    };

    const [total, listUser] = await Promise.all([
      User.count({}),
      User.find({
        select: [
          "email",
          // "fbId",
          "fullName",
          "nickName",
          "createdAt",
          "status",
          "updatedAt",
          // "level",
        ],
        ...findOptions,
      }).sort("createdAt desc"),
    ]);

    for (let user of listUser) {
      user.createdAt = moment(user.createdAt).format(
        constants.DATE_TIME_FORMAT
      );
      user.updatedAt = moment(user.updatedAt).format(
        constants.DATE_TIME_FORMAT
      );
      if (!user.fbId) user.fbId = "None";
      if (!user.email) user.email = "None";
    }

    return res.status(200).json({
      err: 200,
      messsage: "Success",
      data: listUser,
      total,
      ...findOptions,
    });
  }),

  add: tryCatch(async (req, res) => {
    const {
      email,
      fullName,
      nickName,
      birthday,
      gender,
      status,
      level,
      image,
      password,
      confirmPassword,
    } = req.body;
    if (!fullName || !nickName || !birthday || !gender || !email || !password) {
      throw new AppError(400, "Bad Request", 400);
    }
    if (password != confirmPassword)
      throw new AppError(400, "Password not match", 400);

    const checkUserPromise = User.findOne({ or: [{ nickName }, { email }] });
    const getAvatarFramePromise = Decorate.find({
      where: { needPoint: 0 },
      limit: 1,
    });
    const getAvatarTitlePromise = Decorate.find({
      where: { needPoint: 0 },
      limit: 1,
    });
    const [checkUser, avatarFrame, avatarTitle] = await Promise.all([
      checkUserPromise,
      getAvatarFramePromise,
      getAvatarTitlePromise,
    ]);
    if (checkUser) {
      throw new AppError(
        400,
        "User đã tồn tại vui lòng nhập lại Email hoặc Nickname.",
        400
      );
    }
    const uId = uuidV4();
    if (image) {
      var { url } = await uploadImage(
        image,
        `${constants.IMAGE_FOLDER.USER}/${uId}`,
        "avatar"
      );
    }
    const createdUser = await User.create({
      fullName,
      nickName,
      birthday,
      gender,
      status,
      level,
      image: url ?? `${process.env.IMAGEKIT_URL}${constants.USER_AVATAR}`,
      uId,
      email,
      password: hashPassword(password),
      avatarFrame: avatarFrame?.[0]?.id,
      avatarTitle: avatarTitle?.[0]?.id,
    }).fetch();
    if (!createdUser) {
      throw new AppError(400, "Không thể cập nhật user vui lòng thử lại", 400);
    }

    Promise.all([
      UserWallet.create({
        user: checkUser.id,
      }),
    ]);

    return res.status(200).json({ err: 200, message: "Success" });
  }),

  edit: tryCatch(async (req, res) => {
    const { id, fullName, nickName, birthday, gender, status, level, image } =
      req.body;
    if (!fullName || !nickName || !birthday || !gender || !status || !level)
      throw new AppError(400, "Bad Request", 400);

    if (
      await User.findOne({
        where: { nickName, id: { "!=": id } },
      })
    )
      throw new AppError(400, "Nickname đã tồn tại vui lòng nhập lại.", 400);

    const checkUser = await User.findOne({ id });
    if (!checkUser) {
      throw new AppError(400, "User không tồn tại", 400);
    }

    if (image && checkUser.image != image) {
      var { url } = await uploadImage(
        image,
        `${constants.IMAGE_FOLDER.USER}/${checkUser.uId}`,
        "avatar"
      );
    }
    const updatedUser = await User.updateOne({ id }).set({
      fullName,
      nickName,
      birthday,
      gender,
      status,
      level,
      image: url ?? checkUser.image,
    });
    if (!updatedUser) {
      throw new AppError(400, "Không thể cập nhật user vui lòng thử lại", 400);
    }

    return res.status(200).json({
      err: 200,
      message: "Success",
    });
  }),

  detail: tryCatch(async (req, res) => {
    const { id } = req.body;
    if (!id) {
      throw new AppError(400, "Bad Request", 400);
    }

    let user = await User.findOne({ id });

    delete user.password;
    user.createdAt = moment(user.createdAt).format(constants.DATE_TIME_FORMAT);
    user.updatedAt = moment(user.updatedAt).format(constants.DATE_TIME_FORMAT);

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: user,
    });
  }),

  getUserInfo: tryCatch(async (req, res) => {
    const { id } = req.body;
    if (!id) throw new AppError(400, "Bad Request", 400);

    const checkUser = await User.findOne({
      where: { id },
      select: [
        "email",
        "nickName",
        "image",
        "birthday",
        "avatarTitle",
        "gender",
        "avatarFrame",
        // "vipPoint",
        // "levelPoint",
      ],
    });
    if (!checkUser)
      throw new AppError(400, "User is not exists in system.", 400);

    const { avatarTitle, avatarFrame } = checkUser;
    let arrayId = [];
    if (avatarFrame) arrayId.push(avatarFrame);
    if (avatarTitle) arrayId.push(avatarTitle);
    if (arrayId.length > 0) {
      const listDecorate = await Decorate.find({
        where: { id: { in: arrayId } },
      });
      if (listDecorate?.[0]?.id == avatarTitle) {
        checkUser.avatarTitle = listDecorate[0];
        checkUser.avatarFrame = listDecorate[1];
      } else if (listDecorate?.[0]?.id == avatarFrame) {
        checkUser.avatarFrame = listDecorate[0];
        checkUser.avatarTitle = listDecorate[1];
      }
    }

    return res
      .status(200)
      .json({ err: 200, message: "success", data: checkUser });
  }),

  getProfile: tryCatch(async (req, res) => {
    const { id } = req.body;
    if (!id) throw new AppError(400, "ID người dùng không được bỏ trống.", 400);

    const checkUser = await User.findOne({
      where: { id },
      select: ["email", "nickName", "image", "birthday", "gender"],
    });
    if (!checkUser)
      throw new AppError(
        400,
        "User không tồn tại vui lòng thử lại hoặc kiểm tra ID.",
        400
      );

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: checkUser,
    });
  }),

  updateProfile: tryCatch(async (req, res) => {
    updateProfileValidation(req.body);
    const { id, nickName, birthday, gender, image, fullName } = req.body;

    let checkUser = await await User.findOne({ id });
    if (!checkUser)
      throw new AppError(
        400,
        "User không tồn tại vui lòng thử lại hoặc kiểm tra ID.",
        400
      );

    checkUser = await User.findOne({
      where: {
        nickName,
        id: { "!=": id },
      },
    });
    if (checkUser)
      throw new AppError(400, "Nickname đã tồn tại vui lòng nhập lại.", 400);

    const { url = `${process.env.IMAGEKIT_URL}` } = await uploadImage(
      image,
      `user/${id}`,
      "avatar"
    );

    const updatedUser = await User.updateOne({ id }).set({
      nickName,
      birthday,
      gender,
      image: url,
      fullName,
    });

    if (!updatedUser)
      throw new AppError(400, "Không thể cập nhập user vui lòng thử lại.", 400);

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: {
        nickName: updatedUser.nickName,
        image: updatedUser.image,
        gender: updatedUser.gender,
        birthday: updatedUser.birthday,
        fullName: updatedUser.fullName,
      },
    });
  }),

  toggleLikeChapter: tryCatch(async (req, res) => {
    const { userId, chapterIndex, isLike, comicId } = req.body;
    if (!userId || !chapterIndex || typeof isLike != "boolean" || !comicId)
      throw new AppError(400, "Bad request", 400);

    const getUserPromise = User.findOne({ where: { id: userId }, select: [] });
    const getChapterPromise = Chapter.findOne({
      where: { index: chapterIndex, comic: comicId },
      select: [],
    });
    const getInteractComicPromise = InteractComic.findOne({
      user: userId,
      comic: comicId,
    });

    let [checkUser, checkChapter, interactComic] = await Promise.all([
      getUserPromise,
      getChapterPromise,
      getInteractComicPromise,
    ]);
    if (!checkUser) throw new AppError(400, "User không tồn tại", 400);
    if (!checkChapter) throw new AppError(400, "Chapter không tồn tại", 400);
    if (!interactComic) {
      interactComic = await InteractComic.create({
        user: userId,
        comic: comicId,
      }).fetch();
      if (!interactComic)
        throw new AppError(
          400,
          "Server is not responding. Please try again",
          400
        );
    }

    const likeChaptersSet = new Set(interactComic.likeChapters ?? []);
    let handleIncrementLikePromise = null;
    let updateInteractComicPromise = null;
    if (likeChaptersSet.has(checkChapter.id) && !isLike) {
      likeChaptersSet.delete(checkChapter.id);
      handleIncrementLikePromise = Promise.all([
        handleIncNumPromise(checkChapter.id, "chapter", -1, "numOfLike"),
        handleIncNumPromise(comicId, "comic", -1, "numOfLike"),
      ]);
      updateInteractComicPromise = InteractComic.updateOne({
        id: interactComic.id,
      }).set({ likeChapters: [...likeChaptersSet] });
    } else if (!likeChaptersSet.has(checkChapter.id) && isLike) {
      likeChaptersSet.add(checkChapter.id);
      handleIncrementLikePromise = Promise.all([
        handleIncNumPromise(checkChapter.id, "chapter", 1, "numOfLike"),
        handleIncNumPromise(comicId, "comic", 1, "numOfLike"),
      ]);
      updateInteractComicPromise = InteractComic.updateOne({
        id: interactComic.id,
      }).set({ likeChapters: [...likeChaptersSet] });
    }

    Promise.all([updateInteractComicPromise, handleIncrementLikePromise]);

    return res.status(200).json({ err: 200, message: "Success" });
  }),

  getHistoryReading: tryCatch(async (req, res) => {
    const { userId, skip = 0, limit = 15 } = req.body;
    if (!userId) throw new AppError(400, "Bad Request", 400);

    const getUserPromise = User.findOne({ where: { id: userId }, select: [] });
    const db = sails.getDatastore().manager;
    const getReadingHistoryPromise = db
      .collection("interactcomic")
      .aggregate([
        {
          $match: { user: ObjectId(userId) },
        },
        {
          $lookup: {
            from: "comic",
            localField: "comic",
            foreignField: "_id",
            as: "comic",
          },
        },
        {
          $unwind: "$comic",
        },
        {
          $sort: {
            updatedAt: -1,
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
        {
          $project: {
            id: "$comic._id",
            name: "$comic.name",
            image: "$comic.image",
            numOfChapter: "$comic.numOfChapter",
            readingChapter: 1,
          },
        },
      ])
      .toArray();

    const [checkUser, readingHistory] = await Promise.all([
      getUserPromise,
      getReadingHistoryPromise,
    ]);
    if (!checkUser) throw new AppError(400, "User không tồn tại", 400);

    return res.json({
      err: 200,
      message: "Success",
      data: readingHistory,
      skip,
      limit,
    });
  }),

  getComicFollowing: tryCatch(async (req, res) => {
    const { userId, skip = 0, limit = 15 } = req.body;
    if (!userId) throw new AppError(400, "Bad Request", 400);

    const checkUser = await User.findOne({ id: userId });
    if (!checkUser) throw new AppError(400, "User not exists in system.", 400);

    let comicFollowing = [];
    if (checkUser.comicFollowing) {
      comicFollowing = await Comic.find({
        where: {
          id: { in: checkUser.comicFollowing },
        },
        select: [
          "name",
          "description",
          "isHot",
          "image",
          "numOfView",
          "numOfLike",
          "numOfComment",
          "numOfChapter",
        ],
        skip,
        limit,
      });
    }

    return res.status(200).json({
      err: 200,
      messsage: "Success",
      data: comicFollowing,
      skip,
      limit,
    });
  }),

  getAuthorFollowing: tryCatch(async (req, res) => {
    const { userId, skip = 0, limit = 15 } = req.body;
    if (!userId) throw new AppError(400, "Bad Request", 400);

    const checkUser = await User.findOne({ id: userId });
    if (!checkUser) throw new AppError(400, "User not exists in system.", 400);

    let authorFollowing = [];
    if (checkUser.authorFollowing) {
      authorFollowing = await Author.find({
        where: { id: { in: checkUser.authorFollowing } },
        select: ["name", "image", "numOfFollow", "numOfComic", "description"],
        skip,
        limit,
      });
    }

    return res.status(200).json({
      err: 200,
      messsage: "Success",
      data: authorFollowing,
      skip,
      limit,
    });
  }),

  toggleFollowComic: tryCatch(async (req, res) => {
    const { userId, comicId, isFollow } = req.body;
    if (!userId || !comicId || typeof isFollow != "boolean")
      throw new AppError(400, "Bad Request", 400);

    const getUserPromise = User.findOne({
      where: { id: userId },
      select: ["comicFollowing"],
    });
    const getComicPromise = Comic.findOne({
      where: { id: comicId },
      select: [],
    });
    const [user, comic] = await Promise.all([getUserPromise, getComicPromise]);
    if (!user) throw new AppError(400, "User not exists in system.", 400);
    if (!comic) throw new AppError(400, "Comic not exists in system", 400);

    const followingSet = new Set(user.comicFollowing ?? []);
    let incrementFollowPromise = null;
    let updateUserPromise = null;
    if (isFollow && !followingSet.has(comicId)) {
      followingSet.add(comicId);
      incrementFollowPromise = handleIncNumPromise(
        comicId,
        "comic",
        1,
        "numOfFollow"
      );
      updateUserPromise = User.updateOne({ id: userId }).set({
        comicFollowing: [...followingSet],
      });
    } else if (!isFollow && followingSet.has(comicId)) {
      followingSet.delete(comicId);
      incrementFollowPromise = handleIncNumPromise(
        comicId,
        "comic",
        -1,
        "numOfFollow"
      );
      updateUserPromise = User.updateOne({ id: userId }).set({
        comicFollowing: [...followingSet],
      });
    }
    Promise.all([updateUserPromise, incrementFollowPromise]);

    return res.status(200).json({ err: 200, message: "Success" });
  }),

  toggleFollowAuthor: tryCatch(async (req, res) => {
    const { userId, authorId, isFollow } = req.body;
    if (!userId || !authorId || typeof isFollow != "boolean")
      throw new AppError(400, "Bad Request", 400);

    const getUserPromise = User.findOne({
      where: { id: userId },
      select: ["authorFollowing"],
    });
    const getAuthorPromise = Author.findOne({
      where: { id: authorId },
      select: [],
    });
    const [user, author] = await Promise.all([
      getUserPromise,
      getAuthorPromise,
    ]);
    if (!user) throw new AppError(400, "User not exists in system.", 400);
    if (!author) throw new AppError(400, "Author not exists in system", 400);

    const followingSet = new Set(user.authorFollowing ?? []);
    let incrementFollowPromise = null;
    let updateUserPromise = null;
    if (isFollow && !followingSet.has(authorId)) {
      followingSet.add(authorId);
      incrementFollowPromise = handleIncNumPromise(
        authorId,
        "author",
        1,
        "numOfFollow"
      );
      updateUserPromise = User.updateOne({ id: userId }).set({
        authorFollowing: [...followingSet],
      });
    } else if (!isFollow && followingSet.has(authorId)) {
      followingSet.delete(authorId);
      incrementFollowPromise = handleIncNumPromise(
        authorId,
        "author",
        -1,
        "numOfFollow"
      );
      updateUserPromise = User.updateOne({ id: userId }).set({
        authorFollowing: [...followingSet],
      });
    }
    Promise.all([updateUserPromise, incrementFollowPromise]);

    return res.status(200).json({ err: 200, message: "Success" });
  }),

  changeAvatarFrame: tryCatch(async (req, res) => {
    const { avatarFrameId, userId } = req.body;
    if (!avatarFrameId || !userId) throw new AppError(400, "Bad Request", 400);

    const getAvatarFramePromise = Decorate.findOne({
      where: { id: avatarFrameId, tag: "avatar" },
      select: ["image", "needPoint", "action", "title", "type"],
    });
    const getUserWalletPromise = UserWallet.findOne({ user: userId });
    const [avatarFrame, userWallet] = await Promise.all([
      getAvatarFramePromise,
      getUserWalletPromise,
    ]);
    if (!avatarFrame)
      throw new AppError(400, "AvatarFrame not exists in system.", 400);
    if (!userWallet)
      throw new AppError(400, "User wallet not exists in system.", 400);

    let avatarFrameRespone = null;
    if (avatarFrame.needVipTicket) {
      if (userWallet.ticket?.vipTicket?.id == avatarFrame.needVipTicket) {
        avatarFrameRespone = avatarFrame;
      }
    } else {
      if (userWallet.exp >= avatarFrame.needPoint) {
        avatarFrameRespone = avatarFrame;
      }
    }
    if (!avatarFrameRespone)
      throw new AppError(
        400,
        "You cannot have permission to use this AvatarFrame. Pls increment poin.",
        400
      );

    const updatedUserPromise = User.updateOne({ id: userId }).set({
      avatarFrame: avatarFrameRespone.id,
    });
    const updatedCommentPromise = Comment.update({ sender: userId }).set({
      avatarFrame: avatarFrameRespone.image,
    });
    Promise.all([updatedUserPromise, updatedCommentPromise]);

    return res
      .status(200)
      .json({ err: 200, message: "Success", data: avatarFrameRespone });
  }),

  changeAvatarTitle: tryCatch(async (req, res) => {
    const { userId, avatarTitleId } = req.body;
    if (!avatarTitleId || !userId) throw new AppError(400, "Bad Request", 400);

    const getAvatarTitlePromise = Decorate.findOne({
      where: { id: avatarTitleId, tag: "title" },
      select: ["image", "needPoint", "action", "title"],
    });
    const getUserWalletPromise = UserWallet.findOne({ user: userId });
    const [avatarTitle, userWallet] = await Promise.all([
      getAvatarTitlePromise,
      getUserWalletPromise,
    ]);
    if (!avatarTitle)
      throw new AppError(400, "AvatarTitle not exists in system.", 400);
    if (!userWallet)
      throw new AppError(400, "User wallet not exists in system.", 400);

    let avatarTitleRespone = null;
    if (avatarTitle.needVipTicket) {
      if (userWallet.ticket?.vipTicket?.id == avatarTitle.needVipTicket) {
        avatarTitleRespone = avatarTitle;
      }
    } else {
      if (userWallet.exp >= avatarTitle.needPoint) {
        avatarTitleRespone = avatarTitle;
      }
    }
    if (!avatarTitleRespone)
      throw new AppError(
        400,
        "You cannot have permission to use this AvatarFrame. Pls increment poin.",
        400
      );

    const updatedUser = await User.updateOne({ id: userId }).set({
      avatarTitle: avatarTitleRespone.id,
    });
    if (!updatedUser)
      throw new AppError(
        400,
        "Cannot update avatar frame. Pls try againt",
        400
      );
    Comment.update({ sender: userId }).set({
      avatarTitle: avatarTitleRespone.image,
    });

    return res
      .status(200)
      .json({ err: 200, message: "Success", data: avatarTitleRespone });
  }),

  // api/user/sendCommentInChapter
  sendCommentInChapter: tryCatch(async (req, res) => {
    const { senderId, content, chapterIndex, comicId } = req.body;
    if (
      typeof senderId != "string" ||
      typeof content != "string" ||
      typeof chapterIndex != "number" ||
      typeof comicId != "string"
    )
      throw new AppError(400, "Bad request", 400);

    const getSenderPromise = User.findOne({
      where: { id: senderId },
      select: ["avatarFrame", "level", "fullName", "image"],
    });
    const getChapterPromise = Chapter.findOne({
      where: { index: chapterIndex, comic: comicId },
      select: ["comic"],
    });
    const [sender, chapter] = await Promise.all([
      getSenderPromise,
      getChapterPromise,
    ]);
    if (!sender) throw new AppError(400, "User is not exists in system", 400);
    if (!chapter)
      throw new AppError(400, "Chapter is not exists in system", 400);

    const { id, level, fullName, image } = sender;
    const avatarFrame = await Decorate.findOne({
      where: { id: sender.avatarFrame },
      select: ["image"],
    });
    const createdComment = await Comment.create({
      sender: id,
      content,
      chapterIndex,
      chapter: chapter.id,
      comic: chapter.comic,
      senderInfo: {
        avatarFrame: avatarFrame?.image,
        level,
        fullName,
        image,
      },
      canContainComment: true,
    }).fetch();
    if (!createdComment)
      throw new AppError(400, "Cannot send comment. Please try again.", 400);

    const incComicNumCommentPromise = handleIncNumPromise(
      chapter.comic,
      "comic",
      1,
      "numOfComment"
    );
    const incChapterNumCommentPromise = handleIncNumPromise(
      chapter.id,
      "chapter",
      1,
      "numOfComment"
    );
    Promise.all([incChapterNumCommentPromise, incComicNumCommentPromise]);

    return res.status(200).json({ err: 200, message: "Success" });
  }),

  // api/user/sendCommentInComic
  sendCommentInComic: tryCatch(async (req, res) => {
    const { senderId, content, comicId } = req.body;
    if (
      typeof senderId != "string" ||
      typeof content != "string" ||
      typeof comicId != "string"
    )
      throw new AppError(400, "Bad request", 400);

    const getSenderPromise = User.findOne({
      where: { id: senderId },
      select: ["avatarFrame", "level", "fullName", "image"],
    });
    const getComicPromise = Comic.findOne({
      where: { id: comicId },
      select: [],
    });
    const [sender, comic] = await Promise.all([
      getSenderPromise,
      getComicPromise,
    ]);
    if (!sender) throw new AppError(400, "User is not exists in system", 400);
    if (!comic) throw new AppError(400, "Comic is not exists in system", 400);

    const { id, level, fullName, image } = sender;
    const avatarFrame = await Decorate.findOne({
      where: { id: sender.avatarFrame },
      select: ["image"],
    });
    const createdComment = await Comment.create({
      sender: id,
      content,
      level,
      comic: comic.id,
      senderInfo: {
        avatarFrame: avatarFrame?.image,
        level,
        fullName,
        image,
      },
      canContainComment: true,
    }).fetch();
    if (!createdComment)
      throw new AppError(400, "Cannot send comment. Please try again.", 400);

    const incChapterNumCommentPromise = handleIncNumPromise(
      comic.id,
      "comic",
      1,
      "numOfComment"
    );
    Promise.all([incChapterNumCommentPromise]);

    return res.status(200).json({ err: 200, message: "Success" });
  }),

  // api/user/sendCommentInComment
  sendCommentInComment: tryCatch(async (req, res) => {
    const { senderId, content, commentId } = req.body;

    if (
      typeof senderId != "string" ||
      typeof content != "string" ||
      typeof commentId != "string"
    )
      throw new AppError(400, "Bad request", 400);

    const getSenderPromise = User.findOne({
      where: { id: senderId },
      select: ["avatarFrame", "image", "level", "fullName"],
    });
    const getCommentPromise = Comment.findOne({
      where: { id: commentId },
      select: ["comic", "chapter", "canContainComment"],
    });
    const [sender, comment] = await Promise.all([
      getSenderPromise,
      getCommentPromise,
    ]);
    if (!sender) throw new AppError(400, "User is not exists in system", 400);
    if (!comment)
      throw new AppError(400, "Comment is not exists in system", 400);
    if (!comment.canContainComment)
      throw new AppError(400, "This comment cannot contain comment.", 400);

    const avatarFrame = await Decorate.findOne({
      where: { id: sender.avatarFrame },
      select: ["image"],
    });
    const { id, level, fullName, image } = sender;
    const { comic, chapter } = comment;
    const createdComment = await Comment.create({
      sender: id,
      content,
      comic,
      chapter,
      comment: commentId,
      canContainComment: false,
      senderInfo: {
        avatarFrame: avatarFrame?.image,
        level,
        fullName,
        image,
      },
    }).fetch();
    if (!createdComment)
      throw new AppError(400, "Cannot send comment. Please try again.", 400);

    const incComicNumCommentPromise = handleIncNumPromise(
      comic,
      "comic",
      1,
      "numOfComment"
    );
    const incChapterNumCommentPromise = chapter
      ? handleIncNumPromise(chapter, "chapter", 1, "numOfComment")
      : null;
    const incCommentNumCommentPromise = handleIncNumPromise(
      comment.id,
      "comment",
      1,
      "numOfComment"
    );
    Promise.all([
      incChapterNumCommentPromise,
      incComicNumCommentPromise,
      incCommentNumCommentPromise,
    ]);

    return res.status(200).json({ err: 200, message: "Success" });
  }),

  // api/user/toggleLikeComment
  toggleLikeComment: tryCatch(async (req, res) => {
    const { userId, commentId, comicId, isLike } = req.body;
    if (
      typeof userId != "string" ||
      typeof commentId != "string" ||
      typeof comicId != "string" ||
      typeof isLike != "boolean"
    )
      throw new AppError(400, "Bad request", 400);

    const getUserPromise = User.findOne({
      where: { id: userId },
      select: ["likeMyComments"],
    });
    const getCommentPromise = Comment.findOne({
      where: { id: commentId },
      select: ["comic", "sender"],
    });
    const getInteractComicPromise = InteractComic.findOne({
      where: { comic: comicId, user: userId },
      select: ["likeComments"],
    });
    let [user, comment, interactComic] = await Promise.all([
      getUserPromise,
      getCommentPromise,
      getInteractComicPromise,
    ]);

    if (!user) throw new AppError(400, "User is not exists in system.", 400);
    if (!comment)
      throw new AppError(400, "Comment is not exists in system.", 400);
    if (comment.comic != comicId)
      throw new AppError(
        400,
        `Comment not contain in comic with id ${comicId}`,
        400
      );

    if (comment.sender == userId) {
      // handle when toggle like self comment
      const likeCommentsSet = new Set(user.likeMyComments ?? []);
      let updateUserPromise = null;
      let handleIncCommentNumOfLike = null;
      if (likeCommentsSet.has(commentId) && !isLike) {
        likeCommentsSet.delete(commentId);
        updateUserPromise = User.updateOne({ id: user.id }).set({
          likeMyComments: [...likeCommentsSet],
        });
        handleIncCommentNumOfLike = handleIncNumPromise(
          commentId,
          "comment",
          -1,
          "numOfLike"
        );
      }
      if (!likeCommentsSet.has(commentId) && isLike) {
        likeCommentsSet.add(commentId);
        updateUserPromise = User.updateOne({ id: user.id }).set({
          likeMyComments: [...likeCommentsSet],
        });
        handleIncCommentNumOfLike = handleIncNumPromise(
          commentId,
          "comment",
          1,
          "numOfLike"
        );
      }
      await Promise.all([handleIncCommentNumOfLike, updateUserPromise]);
    } else {
      if (!interactComic) {
        interactComic = await InteractComic.create({
          user: userId,
          comic: comicId,
        }).fetch();
        if (!interactComic)
          throw new AppError(
            400,
            "Server is not responding. Please try again",
            400
          );
      }

      const likeCommentsSet = new Set(interactComic.likeComments ?? []);
      let updateInteractComicPromise = null;
      let handleIncCommentNumOfLike = null;
      if (likeCommentsSet.has(commentId) && !isLike) {
        likeCommentsSet.delete(commentId);
        updateInteractComicPromise = InteractComic.updateOne({
          id: interactComic.id,
        }).set({ likeComments: [...likeCommentsSet] });
        handleIncCommentNumOfLike = handleIncNumPromise(
          commentId,
          "comment",
          -1,
          "numOfLike"
        );
      }
      if (!likeCommentsSet.has(commentId) && isLike) {
        likeCommentsSet.add(commentId);
        updateInteractComicPromise = InteractComic.updateOne({
          id: interactComic.id,
        }).set({ likeComments: [...likeCommentsSet] });
        handleIncCommentNumOfLike = handleIncNumPromise(
          commentId,
          "comment",
          1,
          "numOfLike"
        );
      }
      await Promise.all([
        updateInteractComicPromise,
        handleIncCommentNumOfLike,
      ]);
    }

    return res.status(200).json({ err: 200, message: "Success" });
  }),

  // api/user/getListCommented
  getListCommented: tryCatch(async (req, res) => {
    const { userId, skip = 0, limit = 15, sort = "hot" } = req.body;
    if (typeof userId != "string") throw new AppError(400, "Bad request", 400);

    const getUserPromise = User.findOne({
      where: { id: userId },
      select: ["likeMyComments"],
    });
    const getListCommentedPromise = Comment.find({
      where: {
        sender: userId,
        status: { "!=": constants.COMMON_STATUS.IN_ACTIVE },
      },
      select: [
        "senderInfo",
        "content",
        "numOfComment",
        "numOfLike",
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
    const [user, listComment = []] = await Promise.all([
      getUserPromise,
      getListCommentedPromise,
    ]);
    if (!user) throw new AppError(400, "User not exists in system", 400);

    const likeCommentsSet = new Set(user.likeMyComments ?? []);
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
};
