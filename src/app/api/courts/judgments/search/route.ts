import { NextRequest, NextResponse } from "next/server";
import { courtServiceFetch } from "@/lib/court-service";

export async function POST(request: NextRequest) {
  try {
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
