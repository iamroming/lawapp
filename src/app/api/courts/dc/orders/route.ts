import { NextRequest, NextResponse } from "next/server";
import { courtServiceFetch, buildQueryString } from "@/lib/court-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const qs = buildQueryString({
      state_code: searchParams.get("state_code"),
      dist_code: searchParams.get("dist_code"),
      court_complex_code: searchParams.get("court_complex_code"),
      est_code: searchParams.get("est_code"),
      case_type: searchParams.get("case_type"),
      case_number: searchParams.get("case_number"),
      year: searchParams.get("year"),
    });

    const data = await courtServiceFetch(`/api/dc/orders?${qs}`);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
