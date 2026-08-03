import { NextRequest, NextResponse } from "next/server";
import { courtServiceFetch, buildQueryString } from "@/lib/court-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const qs = buildQueryString({
      court_code: searchParams.get("court_code"),
      page_size: searchParams.get("page_size") || "10",
    });

    const data = await courtServiceFetch(`/api/hc/recent-judgments?${qs}`);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
