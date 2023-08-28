import { AppError } from "../../custom/customClass"
import { loginShema, registerShema } from "./user.schema"


export const registerValidation = (body: any) => {
    const value = registerShema.validate(body)
    if (value.error) {
        throw new AppError(400, value.error.message, 400)
    }
}

export const loginValidation = (body: any) => {
    const value = loginShema.validate(body)
    if (value.error) {
        throw new AppError(400, value.error.message, 400)
    }
}