import ImageKit from 'imagekit'
import { AppError } from '../custom/customClass'

const {
    IMAGEKIT_PRIVATE_KEY = '',
    IMAGEKIT_PUBLIC_KEY = '',
    IMAGEKIT_URL_END_POINT = ''
} = process.env

const imageKit = new ImageKit({
    privateKey: IMAGEKIT_PRIVATE_KEY,
    publicKey: IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: IMAGEKIT_URL_END_POINT
})

export const uploadImage = async (image: string, folder: string, fileName: string) => {
    try {
        const respone = await imageKit.upload({
            file: image,
            folder: folder,
            fileName: fileName,
            extensions: [
                {
                    "name": "google-auto-tagging",
                    "minConfidence": 80, // only tags with a confidence value higher than 80% will be attached
                    "maxTags": 10 // a maximum of 10 tags will be attached
                }
            ]
        })
        return respone
    } catch (error: any) {
        throw new AppError(400, error.message, 400)
    }

}

export const mutipleUpload = async () => {
    let files = [
        {
            file: 'https://static.javatpoint.com/computer/images/what-is-the-url.png',
            fileName: "image1.jpg",
            folder: 'comic/tryen1',
        },
        {
            file: 'https://static.javatpoint.com/computer/images/what-is-the-url.png',
            fileName: "image2.jpg",
            folder: 'comic/tryen1',
        },
        {
            file: 'https://static.javatpoint.com/computer/images/what-is-the-url.png',
            fileName: "image3.jpg",
            folder: 'comic/tryen1',
        },
        {
            file: 'https://static.javatpoint.com/computer/images/what-is-the-url.png',
            fileName: "image4.jpg",
            folder: 'comic/tryen1',
        }
    ];
    try {
        const uploadPromises = files.map(file => imageKit.upload(file))
        const allResults = await Promise.all(uploadPromises)

        return allResults
    } catch (error: any) {
        throw new AppError(400, error.message, 400)
    }
}

export default imageKit