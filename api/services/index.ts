import { ObjectId } from 'mongodb'
declare const sails: any


export const handleIncNumPromise = (id: string, collection: string, incNum: number, field: string) => {
    const db = sails.getDatastore().manager
    return db.collection(collection).updateOne(
        { _id: ObjectId(id) },
        { $inc: { [field]: incNum } }
    )
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