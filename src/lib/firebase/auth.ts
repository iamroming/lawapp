import { getAdminAuth } from "./admin";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { firebaseUidToUuid } from "./uid";

const SESSION_COOKIE_NAME = "firebase-session";
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 5; // 5 days

export interface AuthUser {
  uid: string;
  uuid: string;
  email: string | null;
  displayName: string | null;
}

/**
 * Verify the Firebase session cookie and return the authenticated user.
 * Works in: API routes, Server Actions, middleware (via request.cookies)
 */
export async function verifySession(
  cookieStore?: Awaited<ReturnType<typeof cookies>>
): Promise<AuthUser | null> {
  try {
    // If no cookieStore provided, try to get it from next/headers
    if (!cookieStore) {
      try {
        const { cookies: getCookies } = await import("next/headers");
        cookieStore = await getCookies();
      } catch {
        return null;
      }
    }

    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) return null;

    const decoded = await (await getAdminAuth()).verifySessionCookie(sessionCookie, true);
    return {
      uid: decoded.uid,
      uuid: firebaseUidToUuid(decoded.uid),
      email: decoded.email ?? null,
      displayName: decoded.name ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Verify session from a NextRequest (middleware / API routes)
 */
export async function verifySessionFromRequest(
  request: NextRequest
): Promise<AuthUser | null> {
  try {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) return null;

    const decoded = await (await getAdminAuth()).verifySessionCookie(sessionCookie, true);
    return {
      uid: decoded.uid,
      uuid: firebaseUidToUuid(decoded.uid),
      email: decoded.email ?? null,
      displayName: decoded.name ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Create a session cookie from a Firebase ID token.
 * Called from /api/auth/session after client signs in.
 */
export async function createSessionCookie(
  idToken: string
): Promise<{ cookie: string; maxAge: number } | null> {
  try {
    const auth = await getAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_COOKIE_MAX_AGE * 1000,
    });
    return { cookie: sessionCookie, maxAge: SESSION_COOKIE_MAX_AGE };
  } catch (error) {
    console.error("createSessionCookie error:", error);
    return null;
  }
}

/**
 * Clear the session cookie (for logout)
 */
export function clearSessionCookie(
  response: NextResponse
): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

/**
 * Set the session cookie on a response
 */
export function setSessionCookie(
  response: NextResponse,
  cookie: string,
  maxAge: number
): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  return response;
}
