import ImageKit from 'imagekit'
import { AppError } from '../custom/customClass'

const {
    IMAGEKIT_PRIVATE_KEY = '',
    IMAGEKIT_PUBLIC_KEY = '',
    IMAGEKIT_URL = ''
} = process.env

const imageKit = new ImageKit({
    privateKey: IMAGEKIT_PRIVATE_KEY,
    publicKey: IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: IMAGEKIT_URL
})

export const uploadImage = async (image: string, folder: string, fileName: string) => {
    try {
        const respone = await imageKit.upload({
            file: image,
            folder: folder,
            fileName: fileName,
        })
        return respone
    } catch (error: any) {
        throw new AppError(400, error.message, 400)
    }

}

export const mutipleUpload = async (files: string[], folder: string, selectField: string = 'all') => {
    try {
        const uploadPromises = files.map((file, index) => imageKit.upload({
            file,
            fileName: index < 10 ? `0${index.toString()}` : index.toString(),
            folder
        }))
        const allResults = await Promise.all(uploadPromises)
        if (selectField == 'all') {
            return allResults
        }
        return allResults.map(result => result[selectField])
    } catch (error: any) {
        throw new AppError(400, error.message, 400)
    }
}

export const deleteFolder = async (folder: string) => {

}

export default imageKit