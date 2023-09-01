import admin from 'firebase-admin'
const serviceAccount = require('./service-account-key.json')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

export const authAdmin = admin