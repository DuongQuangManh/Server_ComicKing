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
declare const sails: any
declare const User: any
import { ObjectId } from 'mongodb'

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

    adminDetail: tryCatch(async (req, res) => {
        const { id, requestType } = req.body

        let chapter: any
        if (requestType == 'update') {
            chapter = await Chapter.findOne({ id })
        } else {
            chapter = await Chapter.findOne({ id }).populate('comic')
        }
        if (!chapter)
            throw new AppError(400, 'Chapter không tồn tại', 400)

        chapter.createdAt = helper.convertToStringDate(chapter.createdAt)
        chapter.updatedAt = helper.convertToStringDate(chapter.updatedAt)

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: chapter
        })
    }),

    add: tryCatch(async (req, res) => {
        const { title, comic, images, status } = req.body
        if (!title || !comic || !Array.isArray(images) || images.length == 0)
            throw new AppError(400, 'Bad Request', 400)
        if (images.length > 30)
            throw new AppError(400, 'Vui lòng giảm số lượng image (giới hạn 30/1chapter)', 400)

        const checkComic = await Comic.findOne({ id: comic }).select(['uId'])
        if (!checkComic)
            throw new AppError(400, 'Truyện không tồn tại', 400)

        const pathImages = await mutipleUpload(
            images,
            `${constants.IMAGE_FOLDER.CHAPTER}/${checkComic.uId}/chapter1`,
            'url'
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
        const { id, title, comic, images, status } = req.body
        if (!title || !comic || !Array.isArray(images) || images.length == 0)
            throw new AppError(400, 'Bad Request', 400)
        if (images.length > 30)
            throw new AppError(400, 'Vui lòng giảm số lượng image (giới hạn 30/1chapter)', 400)

        const checkChapterPromise = Chapter.findOne({ id }).select(['images'])
        const checkComicPromise = Comic.findOne({ id: comic }).select(['uId'])
        const [checkChapter, checkComic] = await Promise.all([checkChapterPromise, checkComicPromise])
        if (!checkComic)
            throw new AppError(400, 'Truyện không tồn tại', 400)
        if (!checkChapter)
            throw new AppError(400, 'Chapter không tồn tại', 400)

        let matchImgs = true
        if (images.length != checkChapter.images?.length) {
            matchImgs = false
        } else {
            for (let i = 0; i < images.length; i++) {
                if (images[i] != checkChapter.images[i]) {
                    matchImgs = false
                    return
                }
            }
        }
        var pathImages: any
        if (!matchImgs) {
            pathImages = await mutipleUpload(
                images,
                `${constants.IMAGE_FOLDER.CHAPTER}/${checkComic.uId}/chapter1`,
                'url'
            )
        }

        const updatedChapter =
            await Chapter
                .updateOne({ id })
                .set({
                    title,
                    comic,
                    images: pathImages ?? checkChapter.images,
                    status
                })
        if (!updatedChapter)
            throw new AppError(400, 'Không thể cập nhật chapter vui lòng thử lại.', 400)

        return res.status(200).json({
            err: 200,
            message: 'Success'
        })
    }),

    clientDetail: tryCatch(async (req, res) => {
        const { chapterId, userId } = req.body
        if (!chapterId || !userId)
            throw new AppError(400, 'Bad request.', 400)

        const getChapterPromise = Chapter.findOne({
            where: { id: chapterId, status: { '!=': constants.COMMON_STATUS.IN_ACTIVE } },
            select: ['images', 'comic']
        })
        const getUserPromise = User.findOne({
            where: {id: userId},
            select: ['likeChapters']
        })
        const [chapter, user] = await Promise.all([getChapterPromise, getUserPromise])
        if (!chapter)
            throw new AppError(400, 'Chapter không tồn tại.', 400)
        if(!user)
            throw new AppError(400, 'User không tồn tại', 400)

        const db = sails.getDatastore().manager
        const incrementChapterViewPromise = db.collection('chapter')
            .updateOne(
                { _id: ObjectId(chapterId) },
                { $inc: { numOfView: 1 } }
            )
        const incrementComicViewPromise = db.collection('comic')
            .updateOne(
                { _id: ObjectId(chapter.comic), },
                { $inc: { numOfView: 1 } }
            )
        await Promise.all([incrementChapterViewPromise, incrementComicViewPromise])

        if(user.likeChapters?.indexOf(chapterId) != -1){
            chapter.isLike = true
        }
        
        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: chapter
        })
    }),

}