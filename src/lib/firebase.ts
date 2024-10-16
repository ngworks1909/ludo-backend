import { initializeApp } from "firebase/app";
import {getStorage} from "firebase/storage"


const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || 'defaultapikey',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGE_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};


export const app = initializeApp(firebaseConfig);
export const storage = getStorage();