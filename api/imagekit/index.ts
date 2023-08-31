import ImageKit from 'imagekit'
import { AppError } from '../custom/customClass'

const {
    IMAGEKIT_PRIVATE_KEY = '',
    IMAGEKIT_PUBLIC_KEY = '',
    IMAGEKIT_URL_END_POINT = ''
} = process.env

const Imagekit = new ImageKit({
    privateKey: IMAGEKIT_PRIVATE_KEY,
    publicKey: IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: IMAGEKIT_URL_END_POINT
})

export const uploadImage = async () => {
    try {
        const respone = await Imagekit.upload({
            file: 'https://static.javatpoint.com/computer/images/what-is-the-url.png',
            folder: 'comic-book/tryen1',
            fileName: '002.jpg',
            extensions: [
                {
                    "name": "google-auto-tagging",
                    "minConfidence": 80, // only tags with a confidence value higher than 80% will be attached
                    "maxTags": 10 // a maximum of 10 tags will be attached
                }
            ]
        })
        return respone.fileId
    } catch (error: any) {
        throw new AppError(400, error.message, 400)
    }

}

export default Imagekit