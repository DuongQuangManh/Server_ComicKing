/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { constants } from "../constants/constants";
import { AppError } from "../custom/customClass";
import { mutipleUpload } from "../imagekit";
import { deleteFasyField, handleIncNumPromise } from "../services";
import { helper } from "../utils/helper";
import tryCatch from "../utils/tryCatch";

declare const Chapter: any
declare const Comic: any
declare const User: any
declare const InteractComic: any

module.exports = {

    find: tryCatch(async (req, res) => {
        const { skip = 0, limit = 10, condition } = req.body
        const findOption = { skip, limit }

        let whereCondition: any = {}
        if (condition) {
            whereCondition.comic = condition.comic
        }
        deleteFasyField(whereCondition)

        const [total, listChapter] =
            await Promise.all([
                Chapter.count({}),
                Chapter.find({
                    where: whereCondition,
                    ...findOption,
                }).sort('index desc')
            ])

        for (let chapter of listChapter) {
            chapter.createdAt = helper.convertToStringDate(chapter.createdAt)
            chapter.updatedAt = helper.convertToStringDate(chapter.updatedAt)
            chapter.images = chapter.images?.length ?? 0
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
        const { comic, images, status } = req.body
        if (!comic || !Array.isArray(images) || images.length == 0)
            throw new AppError(400, 'Bad Request', 400)
        if (images.length > 30)
            throw new AppError(400, 'Vui lòng giảm số lượng image (tối đa 30/1chapter)', 400)

        const checkComic = await Comic.findOne({ id: comic }).select(['uId', 'lastChapterIndex', 'numOfChapter'])
        if (!checkComic)
            throw new AppError(400, 'Truyện không tồn tại', 400)

        const lastChapterIndex = checkComic.lastChapterIndex
        const pathImages = await mutipleUpload(
            images,
            `${constants.IMAGE_FOLDER.CHAPTER}/${checkComic.uId}/${lastChapterIndex}`,
            'url'
        )

        const createdChapter = await Chapter.create({
            comic,
            images: pathImages,
            status,
            index: lastChapterIndex + 1
        }).fetch()
        if (!createdChapter)
            throw new AppError(400, 'Không thể thêm chapter vui lòng thử lại.', 400)

        const updatedComicPromise = Comic.updateOne({ id: comic }).set({
            lastChapterIndex: lastChapterIndex + 1,
            updatedChapterAt: createdChapter.createdAt,
            numOfChapter: checkComic.numOfChapter + 1
        })
        Promise.all([
            updatedComicPromise,
        ])

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
        const { comicId, userId, chapterIndex } = req.body
        if (!comicId || !userId || !chapterIndex) throw new AppError(400, 'Bad request.', 400)

        const getChapterPromise = Chapter.findOne({
            where: {
                comic: comicId,
                index: chapterIndex,
                status: { '!=': constants.COMMON_STATUS.IN_ACTIVE }
            },
            select: ['images', 'index']
        })
        const getUserPromise = User.findOne({ where: { id: userId }, select: [] })
        const getInteractComicPromise = InteractComic.findOne({ where: { user: userId, comic: comicId } })

        const [chapter, checkUser, interactComic] = await Promise.all([getChapterPromise, getUserPromise, getInteractComicPromise])
        if (!chapter) throw new AppError(400, 'Chapter không tồn tại.', 400)

        let updateinteractComicPromise = null
        if (interactComic) {
            let { readedChapters, readingChapter, likeChapters } = interactComic
            // handle update
            let updateBody = null
            if (readingChapter != chapterIndex) updateBody = { readingChapter: chapterIndex }
            if (!readedChapters?.includes(chapter.id)) {
                readedChapters.push(chapter.id)
                updateBody = { ...updateBody, readedChapters }
            }
            if (updateBody)
                updateinteractComicPromise = InteractComic.updateOne({ id: interactComic.id }).set(updateBody)
            // check like
            chapter.isLike = likeChapters?.includes(chapter.id) ? true : false
        } else {
            if (checkUser) {
                updateinteractComicPromise = InteractComic.create({
                    user: userId,
                    comic: comicId,
                    readedChapters: [chapter.id],
                    readingChapter: chapterIndex
                })
            }
            chapter.isLike = false
        }
        const incrementChapterViewPromise = handleIncNumPromise(chapter.id, 'chapter', 1, 'numOfView')
        const incrementComicViewPromise = handleIncNumPromise(comicId, 'comic', 1, 'numOfView')
        Promise.all([incrementChapterViewPromise, incrementComicViewPromise, updateinteractComicPromise])

        return res.status(200).json({ err: 200, message: 'Success', data: chapter })
    }),

}