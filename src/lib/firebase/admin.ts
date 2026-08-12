import type { App } from "firebase-admin/app";
import type { Auth } from "firebase-admin/auth";

let app: App;
let adminAuth: Auth;

async function getFirebaseAdmin(): Promise<App> {
  if (app) return app;

  const { initializeApp, cert, getApps } = await import("firebase-admin/app");

  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin not configured. Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY"
    );
  }

  let normalizedKey = privateKey
    .replace(/\\n/g, "\n")
    .replace(/^"/, "")
    .replace(/"$/, "")
    .trim();

  if (!normalizedKey.includes("-----BEGIN PRIVATE KEY-----")) {
    throw new Error("FIREBASE_PRIVATE_KEY missing PEM header");
  }

  app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey: normalizedKey }),
  });

  return app;
}

export async function getAdminAuth(): Promise<Auth> {
  if (!adminAuth) {
    const { getAuth } = await import("firebase-admin/auth");
    adminAuth = getAuth(await getFirebaseAdmin());
  }
  return adminAuth;
}
