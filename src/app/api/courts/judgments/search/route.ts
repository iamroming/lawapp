import { NextRequest, NextResponse } from "next/server";
import { courtServiceFetch } from "@/lib/court-service";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();

    const data = await courtServiceFetch("/api/judgments/search", {
      method: "POST",
      body: JSON.stringify({
        text: body.text || null,
        judge: body.judge || null,
        party: body.party || null,
        year: body.year || null,
        court: body.court || null,
        source: body.source || "auto",
        limit: body.limit || 50,
      }),
    });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
