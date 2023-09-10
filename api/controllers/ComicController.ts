/**
 * ComicController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { mutipleUpload, uploadImage } from "../imagekit";
import tryCatch from "../utils/tryCatch";

module.exports = {

    upload: tryCatch(async (req, res) => {
        const result = await uploadImage('https://ik.imagekit.io/c7aqey5nn/user/avatar.png', 'user/abc', 'avatar')
        return res.status(200).json({
            err: 200,
            message: 'upload success',
            result
        })
    }),

    addChapter: tryCatch(async (req, res) => {

    })
};

