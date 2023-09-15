/**
 * AuthorController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { constants } from "../constants/constants";
import { AppError } from "../custom/customClass";
import tryCatch from "../utils/tryCatch";

declare const Author: any
declare const Comic: any

module.exports = {

    find: tryCatch(async (req, res) => {
        const { limit = 10, skip = 0 } = req.body
        const findOption = { limit, skip }

        const total = await Author.count({})
        const authors = await Author.find({
            select: ['name', 'description', 'numOfComic', 'status', 'createdAt'],
            ...findOption
        })

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: authors,
            total,
            ...findOption
        })
    }),

    edit: tryCatch(async (req, res) => {
        const { name, id } = req.body
        if (!id)
            throw new AppError(400, 'ID tác giả không được bỏ trống.', 400)
        if (!name)
            throw new AppError(400, 'Tên tác giả không được bỏ trống.', 400)

        const checkAuthor = await Author.findOne({ name: name.trim() })
        if (checkAuthor)
            throw new AppError(400, 'Tên tác giả đã tồn tại. Vui lòng thử tên khác.', 400)

        const updatedAuthor =
            await Author
                .updateOne({ id })
                .set({ name: name.trim() })
                .fetch()
        if (!updatedAuthor)
            throw new AppError(400, 'Không thể cập nhật tác giả. Vui lòng kiểm tra ID hoặc thử lại.', 400)

        return res.status(200).json({
            err: 200,
            message: 'Cập nhật thành công.'
        })
    }),

    add: tryCatch(async (req, res) => {
        const { name } = req.body
        if (!name)
            throw new AppError(400, 'Tên tác giả không được bỏ trống', 400)

        const checkAuthor = await Author.findOne({ name: name.trim() })
        if (checkAuthor)
            throw new AppError(400, 'Tên tác giả đã tồn tại. Vui lòng thử tên khác.', 400)

        const createdAuthor = await Author.create({ name: name.trim() }).fetch()
        if (!createdAuthor)
            throw new AppError(400, 'Không thể thêm tác giả. Vui lòng thử lại.', 400)

        return res.status(200).json({
            err: 200,
            message: 'Thêm thành công.'
        })
    }),

    detail: tryCatch(async (req, res) => {
        const { id } = req.body
        if (!id)
            throw new AppError(400, 'ID tác giả không được bỏ trống.', 400)

        // const checkAuthor = await Author.findOne({ id })
        // if (!checkAuthor)
        //     throw new AppError(400, 'Không tìm thấy tác giả vui lòng thử lại hoặc thử ID khác', 400)

        const comicsOfAuthor = await Comic.find({
            where: {
                author: id,
                status: { '!=': constants.COMIC_STATUS.INACTIVE }
            },
            select: ['name', 'numOfChapter', 'numOfFavorite', 'status', 'updatedAt', 'isHot']
        })

        return res.json({
            err: 200,
            message: 'Success',
            data: comicsOfAuthor
        })
    })
};

