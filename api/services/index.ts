import { ObjectId } from 'mongodb'
import { constants } from '../constants/constants'
declare const sails: any

export const handleIncNumPromise = (listId: string | string[], collection: string, incNum: number, field: string) => {
    const db = sails.getDatastore().manager
    if (typeof (listId) == 'string') {
        return db.collection(collection).updateOne(
            { _id: ObjectId(listId) },
            { $inc: { [field]: incNum } }
        )
    } else {
        const listObjectId = listId.map((id: string) => ObjectId(id))
        return db.collection(collection).updateMany(
            { _id: { $in: listObjectId } },
            { $inc: { [field]: incNum } }
        )
    }
}

export const deleteFasyField = (object: any) => {
    let keys = Object.keys(object)
    for (let key of keys) {
        if (!object[key]) {
            delete object[key]
        }
    }
    return object
}

export const getDateRangeByTimeline = (timeline: string) => {
    const now = new Date()
    switch (timeline) {
        case constants.TIME_LINE.MONTH:
            return [now, new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30)]
        case constants.TIME_LINE.WEEK:
        default:
            return [now, new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7)]
    }
}