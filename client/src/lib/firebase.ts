import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function signOut() {
  await fbSignOut(auth);
}

export async function getIdToken(forceRefresh = false) {
  const u = auth.currentUser;
  return u ? u.getIdToken(forceRefresh) : null;
}

export function onAuth(
  cb: (user: import("firebase/auth").User | null) => void
) {
  return onAuthStateChanged(auth, cb);
}
