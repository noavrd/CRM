import { initializeApp, applicationDefault, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const app = getApps().length
  ? getApps()[0]!
  : initializeApp({
      credential: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
        ? cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON))
        : applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

export const adminDb = getFirestore(app);
