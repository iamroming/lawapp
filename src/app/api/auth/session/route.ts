import { NextResponse, type NextRequest } from "next/server";
import { createSessionCookie, setSessionCookie, clearSessionCookie } from "@/lib/firebase/auth";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    // Check if Firebase Admin env vars are set
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      console.error("Firebase Admin env vars missing:", {
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      });
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const result = await createSessionCookie(idToken);

    if (!result) {
      console.error("Session creation failed: createSessionCookie returned null");
      return NextResponse.json({ error: "Invalid ID token" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    return setSessionCookie(response, result.cookie, result.maxAge);
  } catch (error) {
    console.error("Session creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  return clearSessionCookie(response);
}
