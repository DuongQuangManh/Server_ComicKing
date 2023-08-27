/**
 * AuthController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { AppError } from "../custom/customClass";
import tryCatch from "../utils/tryCatch";


module.exports = {

    login: tryCatch((req, res, next) => {
        throw new AppError(400, "12345", 100)
    })


};

