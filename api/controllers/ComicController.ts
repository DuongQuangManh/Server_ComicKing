/**
 * ComicController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { uploadImage } from "../imagekit";
import tryCatch from "../utils/tryCatch";

module.exports = {

    upload: tryCatch(async (req, res) => {
        const id = await uploadImage()
        return res.status(200).json({
            err: 200,
            msg: 'upload success',
            id
        })
    })
};

