import { NextFunction, Request, Response } from 'express'

export interface ExpressFunction {
    (req: Request, res: Response, next: NextFunction)
}

export interface DataRespone {
    err: number,
    msg: string
    data?: any,
}