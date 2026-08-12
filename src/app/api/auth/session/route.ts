import { NextResponse, type NextRequest } from "next/server";
import { createSessionCookie, setSessionCookie, clearSessionCookie } from "@/lib/firebase/auth";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const result = await createSessionCookie(idToken);

    if (!result) {
      return NextResponse.json({ error: "Invalid ID token" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    return setSessionCookie(response, result.cookie, result.maxAge);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  return clearSessionCookie(response);
}
