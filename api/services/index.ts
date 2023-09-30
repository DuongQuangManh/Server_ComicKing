import { ObjectId } from 'mongodb'
declare const sails: any


export const handleIncNumPromise = (id: string, collection: string, incNum: number, field: string) => {
    const db = sails.getDatastore().manager
    return db.collection(collection).updateOne(
        { _id: ObjectId(id) },
        { $inc: { [field]: incNum } }
    )
}