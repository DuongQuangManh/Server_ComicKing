import { AppError } from "../custom/customClass";
import tryCatch from "../utils/tryCatch";
import Jwt from "jsonwebtoken";

declare const User: any

module.exports = tryCatch(async (req, res, next) => {
    const authorization = req.headers.authorization

    if (authorization && authorization.split(' ')[0] == 'BEARER') {
        const accessToken = authorization.split(' ')[1]

        Jwt.verify(accessToken, process.env.SECRET_KEY, (error, decoded: Jwt.JwtPayload) => {
            if (!error) {
                const { userId } = decoded
                if (!userId)
                    throw new AppError(401, 'Bạn không có quyền sử dụng tính năng này. Vui lòng đăng kí tài khoản hoặc đăng nhập lại.', 401)

                const existUser = User.findOne({ id: userId })
                if (!existUser)
                    throw new AppError(8013, 'Phiên đã hết hạn vui lòng đăng nhập lại', 401)

                next()
            }
            throw new AppError(8013, 'Phiên đã hết hạn vui lòng đăng nhập lại', 401)
        })
    }
    throw new AppError(8013, 'Phiên đã hết hạn vui lòng đăng nhập lại', 401)
})