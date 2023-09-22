/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { constants } from "../constants/constants";
import { AppError } from "../custom/customClass";
import { mutipleUpload } from "../imagekit";
import { helper } from "../utils/helper";
import tryCatch from "../utils/tryCatch";

declare const Chapter: any
declare const Comic: any

module.exports = {

    find: tryCatch(async (req, res) => {
        const { skip = 0, limit = 10 } = req.body
        const findOption = { skip, limit }

        const [total, listChapter] =
            await Promise.all([
                Chapter.count({}),
                Chapter.find({
                    ...findOption
                }).populate('comic')
            ])

        for (let chapter of listChapter) {
            chapter.createdAt = helper.convertToStringDate(chapter.createdAt)
            chapter.updatedAt = helper.convertToStringDate(chapter.updatedAt)
            chapter.comic = chapter.comic?.name
            chapter.images = chapter.images?.length
        }

        return res.status(200).json({
            err: 200,
            status: 'Success',
            data: listChapter,
            total,
            ...findOption
        })
    }),

    detail: tryCatch(async (req, res) => {


    }),

    add: tryCatch(async (req, res) => {
        const { title, comic, images, status } = req.body
        if (!title || !comic || !Array.isArray(images))
            throw new AppError(400, 'Bad Request', 400)
        if (images.length > 30)
            throw new AppError(400, 'Vui lòng giảm số lượng image (giới hạn 30/1chapter)', 400)

        const checkComic = await Comic.findOne({ id: comic }).select(['uId'])
        if (!checkComic)
            throw new AppError(400, 'Truyện không tồn tại', 400)

        const pathImages = await mutipleUpload(
            images,
            `${constants.IMAGE_FOLDER.CHAPTER}/${checkComic.uId}/chapter1`,
            'filePath'
        )

        const createdChapter = await Chapter.create({
            title,
            comic,
            images: pathImages,
            status
        }).fetch()
        if (!createdChapter)
            throw new AppError(400, 'Không thể thêm chapter vui lòng thử lại.', 400)

        return res.status(200).json({
            err: 200,
            message: 'Success'
        })
    }),

    edit: tryCatch(async (req, res) => {

    }),
}