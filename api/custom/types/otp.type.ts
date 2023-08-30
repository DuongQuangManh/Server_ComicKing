export interface IOtp {
    id?: string,
    email: string,
    code: string,
    expireAt: number,
    otpType: string,
    createdAt?: number,
    updatedAt?: number
}

export interface IOtpVerification extends IOtp {
    data?: {
        fullName: string,
        password: string,
        nickName: string
    } | {}
}

export interface IEmailTemplate {
    subject: string,
    html: string
}

