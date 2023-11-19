/**
 * AuthorController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { constants } from "../constants/constants";
import { AppError } from "../custom/customClass";
import { helper } from "../utils/helper";
import { v4 as uuidV4 } from "uuid";
import tryCatch from "../utils/tryCatch";
import { uploadImage } from "../imagekit";

declare const Author: any;
declare const Comic: any;
declare const User: any;

module.exports = {
  adminFind: tryCatch(async (req, res) => {
    const { limit = 10, skip = 0 } = req.body;
    const findOption = { limit, skip };

    const total = await Author.count({});
    const authors = await Author.find({
      select: [
        "name",
        "numOfComic",
        "status",
        "createdAt",
        "updatedComicAt",
        "numOfFollow",
      ],
      ...findOption,
    });

    authors.map((item) => {
      item.createdAt = helper.convertToStringDate(item.createdAt);
      item.updatedComicAt = helper.convertToStringDate(item.updatedComicAt);
    });

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: authors,
      total,
      ...findOption,
    });
  }),

  edit: tryCatch(async (req, res) => {
    const {
      name,
      id,
      image,
      description,
      status = constants.COMMON_STATUS.ACTIVE,
    } = req.body;
    if (!name || !id || !image || !description)
      throw new AppError(400, "Bad Reques", 400);
    const checkAuthor = await Author.findOne({ id });
    if (!checkAuthor)
      throw new AppError(400, "Author is not exists in system.", 400);

    if (image != checkAuthor.image) {
      var { url } = await uploadImage(
        image,
        `${constants.IMAGE_FOLDER.AUTHOR}/${checkAuthor.uId}`,
        "avatar"
      );
    }

    const updatedAuthor = await Author.updateOne({ id }).set({
      name: name.trim(),
      image: url ? url : image,
      description: description,
      status,
    });
    if (!updatedAuthor)
      throw new AppError(
        400,
        "Không thể cập nhật tác giả. Vui lòng kiểm tra ID hoặc thử lại.",
        400
      );

    return res.status(200).json({
      err: 200,
      message: "Cập nhật thành công.",
    });
  }),

  add: tryCatch(async (req, res) => {
    const {
      name,
      image,
      description,
      status = constants.COMMON_STATUS.ACTIVE,
    } = req.body;
    if (!name || !image || !description)
      throw new AppError(400, "Bad Request", 400);

    const checkAuthor = await Author.findOne({ name: name.trim() });
    if (checkAuthor)
      throw new AppError(
        400,
        "Tên tác giả đã tồn tại. Vui lòng thử tên khác.",
        400
      );

    const uId = uuidV4();
    const { url } = await uploadImage(
      image,
      `${constants.IMAGE_FOLDER.AUTHOR}/${uId}`,
      "avatar"
    );

    const createdAuthor = await Author.create({
      name: name.trim(),
      image: url,
      uId,
      description,
      status,
    }).fetch();
    if (!createdAuthor)
      throw new AppError(400, "Không thể thêm tác giả. Vui lòng thử lại.", 400);

    return res.status(200).json({
      err: 200,
      message: "Thêm thành công.",
    });
  }),

  adminDetail: tryCatch(async (req, res) => {
    const { authorId } = req.body;
    if (!authorId) throw new AppError(400, "Bad Request.", 400);

    const author = await Author.findOne({ id: authorId });
    if (!author) throw new AppError(400, "Author not exists in system", 400);

    return res.json({
      err: 200,
      message: "Success",
      data: author,
    });
  }),

  clientFind: tryCatch(async (req, res) => {
    const { limit = 10, skip = 0, userId } = req.body;
    const findOption = { limit, skip };

    const getListAuthorPromise = Author.find({
      select: ["name", "numOfComic", "image", "numOfFollow"],
      ...findOption,
    });
    let checkUserPromise = null;
    if (userId)
      checkUserPromise = User.findOne({
        where: { id: userId },
        select: ["authorFollowing"],
      });
    const [listAuthor, checkUser] = await Promise.all([
      getListAuthorPromise,
      checkUserPromise,
    ]);
    if (checkUser?.authorFollowing) {
      const listAuthorSet = new Set(checkUser.authorFollowing);
      for (let author of listAuthor) {
        if (listAuthorSet.has(author.id)) {
          author.isFollwing = true;
        }
      }
    }

    return res.status(200).json({
      err: 200,
      message: "Success",
      data: listAuthor,
      ...findOption,
    });
  }),

  clientDetail: tryCatch(async (req, res) => {
    const { authorId, userId, skip = 0, limit = 15 } = req.body;
    if (!authorId) throw new AppError(400, "Bad Request", 400);

    const getAuthorPromise = Author.findOne({
      where: { id: authorId },
      select: [
        "name",
        "image",
        "description",
        "numOfFollow",
        "numOfComic",
        "updatedComicAt",
      ],
    });
    const getListComicPromise = Comic.find({
      where: { author: authorId },
      select: ["name", "description", "isHot", "image"],
      skip,
      limit,
    }).sort("createdAt desc");
    const getUserPromise = userId
      ? User.findOne({ where: { id: userId }, select: ["authorFollowing"] })
      : null;

    const [author, listComic, checkUser] = await Promise.all([
      getAuthorPromise,
      getListComicPromise,
      getUserPromise,
    ]);
    if (!author) throw new AppError(400, "Author not exists in system.", 400);
    if (checkUser?.authorFollowing?.includes(author.id)) {
      author.isFollowing = true;
    }
    author.updatedComicAt = helper.convertToStringDate(
      author.updatedComicAt,
      constants.DATE_FORMAT
    );
    author.listComic = listComic;

    return res.json({
      err: 200,
      message: "Success",
      data: author,
      skip,
      limit,
    });
  }),
};
