import { timeStamp } from "console"
import moment from "moment"
import { constants } from "../constants/constants"

export const helper = {
    convertToStringDate: (timestamp: number, format = constants.DATE_TIME_FORMAT) => {
        return moment(timestamp).format(format)
    },
    convertToTimeStamp: (stringDate: string, format = constants.DATE_FORMAT) => {
        return moment(stringDate, format).valueOf()
    }
}