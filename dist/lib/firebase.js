"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.app = void 0;
const app_1 = require("firebase/app");
const storage_1 = require("firebase/storage");
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || 'defaultapikey',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGE_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};
exports.app = (0, app_1.initializeApp)(firebaseConfig);
exports.storage = (0, storage_1.getStorage)();
