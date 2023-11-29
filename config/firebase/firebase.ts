import admin from "firebase-admin";
const serviceAccount = require("./service-account-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const sendSingleNotification = async (
  deviceToken: string,
  notification: { body: string; title: string },
  data: any
) => {
  try {
    const res = await admin.messaging().send({
      android: {
        priority: "high",
        ttl: 360000,
      },
      token: deviceToken,
      notification: notification,
      data: data,
    });
    return res;
  } catch (error) {
    console.log("Send Noti error : ", error);
  }
};

export const sendMutipleNotification = async (
  deviceTokens: string[],
  notification: { body: string; title: string }
) => {
  try {
    if (Array.isArray(deviceTokens) && deviceTokens.length > 0) {
      const res = await admin.messaging().sendEachForMulticast({
        android: {
          priority: "high",
          ttl: 360000,
        },
        tokens: deviceTokens,
        notification: notification,
      });
      return res;
    }
  } catch (error) {
    console.log("Send Noti error : ", error);
  }
};

export const authAdmin = admin;
