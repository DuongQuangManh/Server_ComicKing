/**
 * CommentController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { constants } from "../constants/constants";
import { AppError } from "../custom/customClass";
import tryCatch from "../utils/tryCatch";

declare const User: any
declare const Comment: any
declare const InteractComic: any

module.exports = {

    adminFind: tryCatch(async (req, res) => {

    }),

    edit: tryCatch(async (req, res) => {

    }),

    adminDetail: tryCatch(async (req, res) => {

    }),

    // api/user/findComment
    clientFind: tryCatch(async (req, res) => {

    }),

    // api/user/detailComment
    clientDetail: tryCatch(async (req, res) => {

    }),

    // api/user/comment/getListComment
    getListComment: tryCatch(async (req, res) => {
        const { userId, commentId, comicId, skip = 0, limit = 15, sort = 'hot' } = req.body
        if (typeof (commentId) != 'string' || typeof (comicId) != 'string')
            throw new AppError(400, 'Bad request', 400)

        let getUserPromise = null
        let getInteractComicPromise = null
        if (userId) {
            getUserPromise = User.findOne({ where: { id: userId }, select: ['likeMyComments'] })
            getInteractComicPromise = InteractComic.findOne({ where: { user: userId, comic: comicId } })
        }
        const getListCommentPromise = Comment.find({
            where: { comment: commentId, status: { '!=': constants.COMMON_STATUS.IN_ACTIVE } },
            select: ['avatarFrame', 'vip', 'level', 'content', 'avatarTitle', 'numOfComment', 'numOfLike'],
        }).sort(sort == 'hot' ? [{ numOfComment: 'DESC' }, { numOfLike: 'DESC' }] : 'createdAt DESC')
            .skip(skip).limit(limit)

        const [user, listComment = [], interactComic] = await Promise.all([
            getUserPromise, getListCommentPromise, getInteractComicPromise
        ])
        let likeCommentsArray = [
            user ? ([...user.likeMyComments]) : [],
            interactComic ? ([...interactComic.likeComments]) : []
        ]
        const likeCommentsSet = new Set(likeCommentsArray)
        for (let comment of listComment) {
            if (likeCommentsSet.has(comment.id)) {
                comment.isLike = true
            }
        }

        return res.status(200).json({
            err: 200, message: 'Success', data: listComment,
            skip, limit
        })
    })
};
