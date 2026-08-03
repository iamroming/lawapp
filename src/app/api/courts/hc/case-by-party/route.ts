import { NextRequest, NextResponse } from "next/server";
import { courtServiceFetch, buildQueryString } from "@/lib/court-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const qs = buildQueryString({
      court_code: searchParams.get("court_code"),
      party_name: searchParams.get("party_name"),
      year: searchParams.get("year"),
      bench_code: searchParams.get("bench_code") || "1",
      status_filter: searchParams.get("status_filter") || "Both",
    });

    const data = await courtServiceFetch(`/api/hc/case-status-by-party?${qs}`);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
