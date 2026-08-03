import { NextRequest, NextResponse } from "next/server";
import { courtServiceFetch, buildQueryString } from "@/lib/court-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const qs = buildQueryString({
      state_code: searchParams.get("state_code"),
      district_code: searchParams.get("district_code"),
      court_complex_code: searchParams.get("court_complex_code"),
      party_name: searchParams.get("party_name"),
      year: searchParams.get("year"),
    });

    const data = await courtServiceFetch(`/api/dc/case-by-party?${qs}`);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
