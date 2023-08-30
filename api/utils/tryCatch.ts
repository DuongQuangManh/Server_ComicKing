import { Request, Response, NextFunction } from 'express'
import { ExpressFunction } from '../custom/customType'
import errorHandler from './errorHandler'

export default (fn: ExpressFunction) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        return await fn(req, res, next)
    } catch (error: any) {
        console.log("Error : ", error)
        return errorHandler(error, res)
    }
}