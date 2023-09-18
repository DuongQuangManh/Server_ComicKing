import { timeStamp } from "console"
import moment from "moment"
import { constants } from "../constants/constants"

export const helper = {
    convertToStringDate: (timestamp: number) => {
        return moment(timestamp).format(constants.DATE_TIME_FORMAT)
    },
    convertToTimeStamp: (stringDate: string) => {
        return moment(stringDate, 'DD/MM/YYYY').valueOf()
    }
}