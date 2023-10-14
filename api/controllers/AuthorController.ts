/**
 * AuthorController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { constants } from "../constants/constants";
import { AppError } from "../custom/customClass";
import { helper } from "../utils/helper";
import tryCatch from "../utils/tryCatch";

declare const Author: any
declare const Comic: any

module.exports = {

    adminFind: tryCatch(async (req, res) => {
        const { limit = 10, skip = 0 } = req.body
        const findOption = { limit, skip }

        const total = await Author.count({})
        const authors = await Author.find({
            select: ['name', 'numOfComic', 'status', 'createdAt', 'updatedComicAt', 'numOfFollow'],
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

    adminDetail: tryCatch(async (req, res) => {
        const { id } = req.body
        if (!id)
            throw new AppError(400, 'Bad Request.', 400)

        const author = await Author.findOne({ id })
        if (!author) throw new AppError(400, 'Author not exists in system', 400)

        return res.json({
            err: 200,
            message: 'Success',
            data: author
        })
    }),

    clientFind: tryCatch(async (req, res) => {
        const { limit = 10, skip = 0 } = req.body
        const findOption = { limit, skip }

        const authors = await Author.find({
            select: ['name', 'numOfComic', 'image', 'numOfFollow'],
            ...findOption
        })

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: authors,
            ...findOption
        })
    }),

    clientDetail: tryCatch(async (req, res) => {
        const { id, skip = 0, limit = 15 } = req.body
        if (typeof id != 'string')
            throw new AppError(400, 'Bad Request', 400)

        const getAuthorPromise = Author.findOne({
            where: {
                id: id,
            },
            select: ['name', 'image', 'description', 'numOfFollow', 'numOfComic', 'updatedComicAt']
        })
        const getListComicPromise = Comic.find({
            where: {
                author: id
            },
            select: ['name', 'description', 'isHot', 'image'],
            skip, limit
        }).sort('createdAt desc')

        const [author, listComic] = await Promise.all([getAuthorPromise, getListComicPromise])
        author.updatedComicAt = helper.convertToStringDate(author.updatedComicAt, constants.DATE_FORMAT)
        author.listComic = listComic

        return res.json({
            err: 200,
            message: 'Success',
            data: author,
            skip, limit
        })
    })
};

