import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

function isConfigValid(): boolean {
  return !!firebaseConfig.apiKey && !!firebaseConfig.projectId;
}

function initApp(): FirebaseApp {
  if (!app) {
    if (getApps().length > 0) {
      app = getApps()[0];
    } else if (isConfigValid()) {
      app = initializeApp(firebaseConfig);
    } else {
      // During build/SSG without env vars, return a dummy
      // This prevents crashes during prerendering
      app = initializeApp({ projectId: "dummy", apiKey: "dummy", authDomain: "dummy.firebaseapp.com" });
    }
  }
  return app;
}

export function getFirebaseApp(): FirebaseApp {
  return initApp();
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(initApp());
  }
  return auth;
}

export { isConfigValid };
