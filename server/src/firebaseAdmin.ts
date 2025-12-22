import {
  initializeApp,
  applicationDefault,
  cert,
  getApps,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

function loadServiceAccount() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      const jsonStr = fs.readFileSync(path, "utf8");
      const obj = JSON.parse(jsonStr);
      if (typeof obj.private_key === "string") {
        obj.private_key = obj.private_key.replace(/\\n/g, "\n");
      }
      return cert(obj);
    } catch (e) {
      console.error("Failed to read GOOGLE_APPLICATION_CREDENTIALS file");
      throw e;
    }
  }

  return applicationDefault();
}

const app =
  getApps().length > 0
    ? getApps()[0]!
    : initializeApp({
        credential: loadServiceAccount(),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });

export const adminDb = getFirestore(app);
