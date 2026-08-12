import { NextRequest, NextResponse } from "next/server";
import { courtServiceFetch } from "@/lib/court-service";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

export async function GET() {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const data = await courtServiceFetch("/api/courts/list");
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
