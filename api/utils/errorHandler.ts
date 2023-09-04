import { Response } from 'express'
import { AppError } from '../custom/customClass'

export default (error: Error, res: Response) => {
    if (error instanceof AppError) {
        return res.status(error.errorCode).json({
            err: error.errorCode,
            message: error.message
        })
    }

    return res.status(500).json({ err: 500, message: 'Server error!' })
}