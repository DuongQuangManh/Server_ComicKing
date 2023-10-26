/**
 * ClienHomeController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

import { constants } from "../constants/constants";
import tryCatch from "../utils/tryCatch";

declare const Comic: any

module.exports = {
    
    getHomeComics: tryCatch(async (req, res) => {

    }),

    getDoneComics: tryCatch(async (req, res) => {
        let limit = 6

        const doneComics = await Comic.find({
            where: {
                status: constants.COMIC_STATUS.DONE
            },
            limit
        })

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: {
                title: 'Hoàn thành',
                canMore: true,
                listComic: doneComics
            }
        })
    }),

    getSliderComics: tryCatch(async (req, res) => {
        let limit = 6

        const sliderComics = await Comic.find({
            limit
        })

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: {
                title: '',
                canMore: false,
                listComic: sliderComics
            }
        })
    }),

    getNewestComics: tryCatch(async (req, res) => {
        let limit = 6

        const newestComics = await Comic.find({}).sort('updatedAt desc').limit(limit)

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: {
                title: 'Mới nhất',
                canMore: true,
                listComic: newestComics
            }
        })
    }),

    getProposeComics: tryCatch(async (req, res) => {
        let limit = 6

        const proposeComics = await Comic.find({
            limit,
            skip: 6
        })

        return res.status(200).json({
            err: 200,
            message: 'Success',
            data: {
                title: 'Đề xuất',
                canMore: false,
                listComic: proposeComics
            }
        })
    })

};

