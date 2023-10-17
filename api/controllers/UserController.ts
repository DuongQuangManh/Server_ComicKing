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
import { v4 as uuidV4 } from 'uuid'
import { hashPassword } from "../services/AuthService";
import { handleIncNumPromise } from "../services";

declare const User: any
declare const Chapter: any
declare const Comic: any
declare const Author: any
declare const InteractComic: any
declare const Decorate: any

module.exports = {

    find: tryCatch(async (req, res) => {
        const { skip = 0, limit = 10, } = req.body
        const findOptions = {
            skip,
            limit
        }

        const [total, listUser] =
            await Promise.all([
                User.count({}),
                User.find({
                    select: ['email', 'fbId', 'fullName', 'nickName', 'createdAt', 'status', 'updatedAt', 'level'],
                    ...findOptions
                }).sort('createdAt desc')
            ])

        for (let user of listUser) {
            user.createdAt = moment(user.createdAt).format(constants.DATE_TIME_FORMAT)
            user.updatedAt = moment(user.updatedAt).format(constants.DATE_TIME_FORMAT)
            if (!user.fbId) user.fbId = 'None'
            if (!user.email) user.email = 'None'
        }

        return res.status(200).json({
            err: 200,
            messsage: 'Success',
            data: listUser,
            total,
            ...findOptions
        })
    }),

    add: tryCatch(async (req, res) => {
        const {
            email, fullName, nickName, birthday, gender,
            status, level, image, password, confirmPassword
        } = req.body
        if (!fullName || !nickName || !birthday || !gender || !email || !password) {
            throw new AppError(400, 'Bad Request', 400)
        }
        if (password != confirmPassword) throw new AppError(400, 'Password not match', 400)

        const checkUserPromise = User.findOne({ or: [{ nickName }, { email }] })
        const getAvatarFramePromise = Decorate.find({ where: { needPoint: 0 }, limit: 1 })
        const getAvatarTitlePromise = Decorate.find({ where: { needPoint: 0 }, limit: 1 })
        const [checkUser, avatarFrame, avatarTitle] =
            await Promise.all([checkUserPromise, getAvatarFramePromise, getAvatarTitlePromise])
        if (checkUser) {
            throw new AppError(400, 'User đã tồn tại vui lòng nhập lại Email hoặc Nickname.', 400)
        }
        const uId = uuidV4()
        if (image) {
            var { url } = await uploadImage(image, `${constants.IMAGE_FOLDER.USER}/${uId}`, 'avatar')
        }
        const createdUser = await User.create({
            fullName, nickName, birthday, gender, status, level,
            image: url ?? `${process.env.IMAGEKIT_URL}${constants.USER_AVATAR}`,
            uId, email, password: hashPassword(password),
            avatarFrame: avatarFrame?.[0]?.id, avatarTitle: avatarTitle?.[0]?.id
        }).fetch()
        if (!createdUser) {
            throw new AppError(400, 'Không thể cập nhật user vui lòng thử lại', 400)
        }

        return res.status(200).json({ err: 200, message: 'Success' })
    }),

    edit: tryCatch(async (req, res) => {
        const { id, fullName, nickName, birthday, gender, status, level, image } = req.body
        if (!fullName || !nickName || !birthday || !gender || !status || !level)
            throw new AppError(400, 'Bad Request', 400)

        if (await User.findOne({
            where: {
                nickName,
                id: { '!=': id }
            }
        })) throw new AppError(400, 'Nickname đã tồn tại vui lòng nhập lại.', 400)

        const checkUser = await User.findOne({ id })
        if (!checkUser) {
            throw new AppError(400, 'User không tồn tại', 400)
        }

        if (image && checkUser.image != image) {
            var { url } = await uploadImage(image, `${constants.IMAGE_FOLDER.USER}/${checkUser.uId}`, 'avatar')
        }
        const updatedUser = await User.updateOne({ id }).set({
            fullName,
            nickName,
            birthday,
            gender,
            status,
            level,
            image: url ?? checkUser.image
        })
        if (!updatedUser) {
            throw new AppError(400, 'Không thể cập nhật user vui lòng thử lại', 400)
        }

        return res.status(200).json({
            err: 200,
            message: 'Success'
        })
    }),

    detail: tryCatch(async (req, res) => {
        const { id } = req.body
        if (!id) {
            throw new AppError(400, 'Bad Request', 400)
        }

        let user = await User.findOne({ id })

        delete user.password
        user.createdAt = moment(user.createdAt).format(constants.DATE_TIME_FORMAT)
        user.updatedAt = moment(user.updatedAt).format(constants.DATE_TIME_FORMAT)

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: user
        })
    }),

    getUserInfo: tryCatch(async (req, res) => {
        const { id } = req.body
        if (!id) throw new AppError(400, 'Bad Request', 400)

        const checkUser = await User.findOne({
            where: { id },
            select: [
                'email', 'nickName', 'image', 'birthday', 'avatarTitle',
                'gender', 'avatarFrame', 'vipPoint', 'levelPoint'
            ]
        })
        const { avatarTitle, avatarFrame } = checkUser
        let arrayId = []
        if (avatarFrame) arrayId.push(avatarFrame)
        if (avatarTitle) arrayId.push(avatarTitle)
        if (arrayId.length > 0) {
            const listDecorate = await Decorate.find({ where: { id: { in: arrayId } } })
            if(listDecorate?.[0]?.id == avatarTitle){
                checkUser.avatarTitle = listDecorate[0]
                checkUser.avatarFrame = listDecorate[1]
            }else if(listDecorate?.[0]?.id == avatarFrame){
                checkUser.avatarFrame = listDecorate[0]
                checkUser.avatarTitle = listDecorate[1]
            }
        }

        console.log(checkUser)

        return res.status(200).json({ err: 200, message: 'success', data: checkUser })
    }),

    getProfile: tryCatch(async (req, res) => {
        const { id } = req.body
        if (!id) throw new AppError(400, 'ID người dùng không được bỏ trống.', 400)

        const checkUser = await User.findOne({
            where: { id },
            select: ['email', 'nickName', 'image', 'birthday', 'gender']
        })
        if (!checkUser)
            throw new AppError(400, 'User không tồn tại vui lòng thử lại hoặc kiểm tra ID.', 400)

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: checkUser
        })
    }),

    updateProfile: tryCatch(async (req, res) => {
        updateProfileValidation(req.body)
        const { id, nickName, birthday, gender, image, fullName } = req.body

        let checkUser = await await User.findOne({ id })
        if (!checkUser)
            throw new AppError(400, 'User không tồn tại vui lòng thử lại hoặc kiểm tra ID.', 400)

        checkUser = await User.findOne({
            where: {
                nickName,
                id: { '!=': id }
            }
        })
        if (checkUser)
            throw new AppError(400, 'Nickname đã tồn tại vui lòng nhập lại.', 400)

        const { url = `${process.env.IMAGEKIT_URL}` } = await uploadImage(image, `user/${id}`, 'avatar')

        const updatedUser =
            await User.updateOne({ id })
                .set({
                    nickName,
                    birthday,
                    gender,
                    image: url,
                    fullName
                })

        if (!updatedUser)
            throw new AppError(400, 'Không thể cập nhập user vui lòng thử lại.', 400)

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: {
                nickName: updatedUser.nickName,
                image: updatedUser.image,
                gender: updatedUser.gender,
                birthday: updatedUser.birthday,
                fullName: updatedUser.fullName
            }
        })
    }),

    toggleLikeChapter: tryCatch(async (req, res) => {
        const { userId, chapterIndex, isLike, comicId } = req.body
        if (!userId || !chapterIndex || typeof isLike != 'boolean' || !comicId)
            throw new AppError(400, 'Bad request', 400)

        const getUserPromise = User.findOne({ where: { id: userId }, select: [] })
        const getChapterPromise = Chapter.findOne({ where: { index: chapterIndex, comic: comicId }, select: [] })
        const getInteractComicPromise = InteractComic.findOne({ user: userId, comic: comicId })

        const [checkUser, checkChapter, interactComic] = await Promise.all([getUserPromise, getChapterPromise, getInteractComicPromise])
        if (!checkUser) throw new AppError(400, 'User không tồn tại', 400)
        if (!checkChapter) throw new AppError(400, 'Chapter không tồn tại', 400)
        if (!interactComic) throw new AppError(400, 'Pls goto chapter detail first', 400)

        const likeChaptersSet = new Set(interactComic.likeChapters ?? [])
        let handleIncrementLikePromise = null
        let updateInteractComicPromise = null
        if (likeChaptersSet.has(checkChapter.id) && !isLike) {
            likeChaptersSet.delete(checkChapter.id)
            handleIncrementLikePromise = Promise.all([
                handleIncNumPromise(checkChapter.id, 'chapter', -1, 'numOfLike'),
                handleIncNumPromise(comicId, 'comic', -1, 'numOfLike')
            ])
            updateInteractComicPromise =
                InteractComic.updateOne({ id: interactComic.id }).set({ likeChapters: [...likeChaptersSet] })
        } else if (!likeChaptersSet.has(checkChapter.id) && isLike) {
            likeChaptersSet.add(checkChapter.id)
            handleIncrementLikePromise = Promise.all([
                handleIncNumPromise(checkChapter.id, 'chapter', 1, 'numOfLike'),
                handleIncNumPromise(comicId, 'comic', 1, 'numOfLike')
            ])
            updateInteractComicPromise =
                InteractComic.updateOne({ id: interactComic.id }).set({ likeChapters: [...likeChaptersSet] })
        }

        Promise.all([updateInteractComicPromise, handleIncrementLikePromise])

        return res.status(200).json({ err: 200, message: 'Success' })
    }),

    getHistoryReading: tryCatch(async (req, res) => {
        const { userId, skip = 0, limit = 8 } = req.body
        if (!userId) throw new AppError(400, 'Bad Request', 400)

        const getUserPromise = User.findOne({ where: { id: userId }, select: [], })
        const getReadingHistoryPromise = InteractComic.find({
            where: { user: userId },
            skip, limit
        }).populate('comic').sort('updatedAt desc')

        const [checkUser, readingHistory] = await Promise.all([getUserPromise, getReadingHistoryPromise])
        if (!checkUser)
            throw new AppError(400, 'User không tồn tại', 400)

        const listComic = readingHistory?.map((item: any) => ({
            name: item.comic?.name,
            readingChapterIndex: item.chapterIndex,
            description: item.comic?.description,
            isHot: item.comic?.isHot,
            image: item.comic?.image,
            id: item.comic?.id
        }))

        return res.json({ err: 200, message: 'Success', data: listComic, skip, limit })
    }),

    getComicFollowing: tryCatch(async (req, res) => {
        const { userId, skip = 0, limit = 15 } = req.body
        if (!userId)
            throw new AppError(400, 'Bad Request', 400)

        const checkUser = await User.findOne({ id: userId })
        if (!checkUser) throw new AppError(400, 'User not exists in system.', 400)

        let comicFollowing = []
        if (checkUser.comicFollowing) {
            comicFollowing = await Comic.find({
                where: {
                    id: { in: checkUser.comicFollowing }
                },
                select: ['name', 'description', 'isHot', 'image'],
                skip, limit
            })
        }

        return res.status(200).json({
            err: 200,
            messsage: 'Success',
            data: comicFollowing,
            skip, limit
        })
    }),

    getAuthorFollowing: tryCatch(async (req, res) => {
        const { userId, skip = 0, limit = 15 } = req.body
        if (!userId)
            throw new AppError(400, 'Bad Request', 400)

        const checkUser = await User.findOne({ id: userId })
        if (!checkUser) throw new AppError(400, 'User not exists in system.', 400)

        let authorFollowing = []
        if (checkUser.authorFollowing) {
            authorFollowing = await Author.find({
                where: {
                    id: { in: checkUser.authorFollowing }
                },
                select: ['name', 'image'],
                skip, limit
            })
        }

        return res.status(200).json({
            err: 200,
            messsage: 'Success',
            data: authorFollowing,
            skip, limit
        })
    }),

    toggleFollowComic: tryCatch(async (req, res) => {
        const { userId, comicId, isFollow } = req.body
        if (!userId || !comicId || typeof isFollow != 'boolean')
            throw new AppError(400, 'Bad Request', 400)

        const getUserPromise = User.findOne({
            where: { id: userId },
            select: ['comicFollowing']
        })
        const getComicPromise = Comic.findOne({
            where: { id: comicId },
            select: []
        })
        const [user, comic] = await Promise.all([getUserPromise, getComicPromise])
        if (!user) throw new AppError(400, 'User not exists in system.', 400)
        if (!comic) throw new AppError(400, 'Comic not exists in system', 400)

        const followingSet = new Set(user.comicFollowing ?? [])
        let incrementFollowPromise = null
        let updateUserPromise = null
        if (isFollow && !followingSet.has(comicId)) {
            followingSet.add(comicId)
            incrementFollowPromise = handleIncNumPromise(comicId, 'comic', 1, 'numOfFollow')
            updateUserPromise = User.updateOne({ id: userId }).set({ comicFollowing: [...followingSet] })
        } else if (!isFollow && followingSet.has(comicId)) {
            followingSet.delete(comicId)
            incrementFollowPromise = handleIncNumPromise(comicId, 'comic', -1, 'numOfFollow')
            updateUserPromise = User.updateOne({ id: userId }).set({ comicFollowing: [...followingSet] })
        }
        Promise.all([updateUserPromise, incrementFollowPromise])

        return res.status(200).json({ err: 200, message: 'Success' })
    }),

    toggleFollowAuthor: tryCatch(async (req, res) => {
        const { userId, authorId, isFollow } = req.body
        if (!userId || !authorId || typeof isFollow != 'boolean')
            throw new AppError(400, 'Bad Request', 400)

        const getUserPromise = User.findOne({
            where: { id: userId },
            select: ['authorFollowing']
        })
        const getAuthorPromise = Author.findOne({
            where: { id: authorId },
            select: []
        })
        const [user, author] = await Promise.all([getUserPromise, getAuthorPromise])
        if (!user) throw new AppError(400, 'User not exists in system.', 400)
        if (!author) throw new AppError(400, 'Author not exists in system', 400)

        const followingSet = new Set(user.authorFollowing ?? [])
        let incrementFollowPromise = null
        let updateUserPromise = null
        if (isFollow && !followingSet.has(authorId)) {
            followingSet.add(authorId)
            incrementFollowPromise = handleIncNumPromise(authorId, 'author', 1, 'numOfFollow')
            updateUserPromise = User.updateOne({ id: userId }).set({ authorFollowing: [...followingSet] })
        } else if (!isFollow && followingSet.has(authorId)) {
            followingSet.delete(authorId)
            incrementFollowPromise = handleIncNumPromise(authorId, 'author', -1, 'numOfFollow')
            updateUserPromise = User.updateOne({ id: userId }).set({ authorFollowing: [...followingSet] })
        }
        Promise.all([updateUserPromise, incrementFollowPromise])

        return res.status(200).json({ err: 200, message: 'Success' })
    }),

    changeAvatarFrame: tryCatch(async (req, res) => {
        const { avatarFrameId, userId } = req.body
        if (!avatarFrameId || !userId) throw new AppError(400, 'Bad Request', 400)

        const getAvatarFramePromise = Decorate.findOne({
            where: { id: avatarFrameId, tag: 'avatar' },
            select: ['image', 'needPoint', 'description', 'action', 'title', 'type']
        })
        const getUserPromise = User.findOne({
            where: { id: userId },
            select: ['levelPoint', 'vipPoint']
        })
        const [avatarFrame, user] = await Promise.all([getAvatarFramePromise, getUserPromise])
        if (!avatarFrame) throw new AppError(400, 'AvatarFrame not exists in system.', 400)
        if (!user) throw new AppError(400, 'User not exists in system.', 400)

        let avatarFrameRespone = null
        if (avatarFrame.type == 'event') {
            // do something for event Avatar Frame
        } else if (avatarFrame.type == 'vip') {
            if (user.vipPoint >= avatarFrame.needPoint) {
                avatarFrameRespone = avatarFrame
            }
        } else { // type == level
            if (user.levelPoint >= avatarFrame.needPoint) {
                avatarFrameRespone = avatarFrame
            }
        }
        if (!avatarFrameRespone)
            throw new AppError(400, 'You cannot have permission to use this AvatarFrame. Pls increment poin.', 400)

        const updatedUser = await User.updateOne({ id: userId }).set({ avatarFrame: avatarFrameRespone.id })
        if (!updatedUser)
            throw new AppError(400, 'Cannot update avatar frame. Pls try againt', 400)

        return res.status(200).json({ err: 200, message: 'Success', data: avatarFrameRespone })
    }),

    changeAvatarTitle: tryCatch(async (req, res) => {
        const { userId, avatarTitleId } = req.body
        if (!avatarTitleId || !userId) throw new AppError(400, 'Bad Request', 400)

        const getAvatarTitlePromise = Decorate.findOne({
            where: { id: avatarTitleId, tag: 'title' },
            select: ['image', 'needPoint', 'description', 'action', 'title']
        })
        const getUserPromise = User.findOne({
            where: { id: userId },
            select: ['levelPoint', 'vipPoint']
        })
        const [avatarTitle, user] = await Promise.all([getAvatarTitlePromise, getUserPromise])
        if (!avatarTitle) throw new AppError(400, 'AvatarTitle not exists in system.', 400)
        if (!user) throw new AppError(400, 'User not exists in system.', 400)

        let avatarTitleRespone = null
        if (avatarTitle.type == 'event') {
            // do something for event Avatar Frame
        } else if (avatarTitle.type == 'vip') {
            if (user.vipPoint >= avatarTitle.needPoint) {
                avatarTitleRespone = avatarTitle
            }
        } else { // type == level
            if (user.levelPoint >= avatarTitle.needPoint) {
                avatarTitleRespone = avatarTitle
            }
        }
        if (!avatarTitleRespone)
            throw new AppError(400, 'You cannot have permission to use this AvatarFrame. Pls increment poin.', 400)

        const updatedUser = await User.updateOne({ id: userId }).set({ avatarFrame: avatarTitleRespone.id })
        if (!updatedUser)
            throw new AppError(400, 'Cannot update avatar frame. Pls try againt', 400)

        return res.status(200).json({ err: 200, message: 'Success', data: avatarTitleRespone })
    })
};

