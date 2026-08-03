import { NextResponse } from "next/server";

// REMOVED: Hardcoded admin backdoor route
// This route was a security risk - it granted super_admin access to a hardcoded email.
// Admin setup should be done via Supabase dashboard or a secure CLI script.
export async function POST() {
  return NextResponse.json(
    { error: "This endpoint has been removed for security reasons." },
    { status: 410 }
  );
}
