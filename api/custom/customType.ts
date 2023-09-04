import { NextFunction, Request, Response } from 'express'

export interface ExpressFunction {
    (req: Request, res: Response, next: NextFunction)
}

export interface DataRespone {
    err: number,
    message: string
    data?: any,
}