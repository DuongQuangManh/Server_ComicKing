import { ObjectId } from "mongodb";
import { constants } from "../constants/constants";
import moment from "moment";
declare const sails: any;

export const handleIncNumPromise = (
  listId: string | string[],
  collection: string,
  incNum: number,
  field: string
) => {
  const db = sails.getDatastore().manager;
  if (typeof listId == "string") {
    return db
      .collection(collection)
      .updateOne({ _id: ObjectId(listId) }, { $inc: { [field]: incNum } });
  } else {
    const listObjectId = listId.map((id: string) => ObjectId(id));
    return db
      .collection(collection)
      .updateMany(
        { _id: { $in: listObjectId } },
        { $inc: { [field]: incNum } }
      );
  }
};

export const deleteFasyField = (object: any) => {
  let keys = Object.keys(object);
  for (let key of keys) {
    if (!object[key]) {
      delete object[key];
    }
  }
  return object;
};

export const getDateRangeByTimeline = (timeline: string) => {
  const now = new Date();
  switch (timeline) {
    case constants.TIME_LINE.MONTH:
      return [now, new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30)];
    case constants.TIME_LINE.WEEK:
    default:
      return [now, new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7)];
  }
};

export const getStartOfDayTimestamp = (dayIndex: number) => {
  const today = moment();

  // Tạo một moment mới từ ngày hiện tại
  const day = moment(today);

  // Thiết lập ngày tháng năm bằng ngày hiện tại
  // để giữ nguyên năm tháng, chỉ đổi ngày trong tuần
  day.set("date", today.date());

  // Dịch chuyển ngày trong tuần theo index
  day.add(dayIndex - today.day(), "days");

  // Reset giờ phút giây về 0h 0m 0s
  day.startOf("day");

  // Lấy timestamp
  return day.valueOf();
};
