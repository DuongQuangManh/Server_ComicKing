import JWT from 'jsonwebtoken'
import Bcryptjs from 'bcryptjs'
const SECRETKEY = process.env.SECRETKEY as string

export const generateToken = (payload: (string | object | Buffer)) => {
    const token = JWT.sign(payload, SECRETKEY, {
        expiresIn: '1h'
    })
    return token
}

export const hashPassword = (password: string) => {
    const salt = Bcryptjs.genSaltSync()
    const hashedPassword = Bcryptjs.hashSync(password, salt)
    return hashedPassword
}

export const checkPassword = (hashedPassword: string, password: string) => {
    return Bcryptjs.compareSync(password, hashedPassword)
}