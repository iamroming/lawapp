import { NextRequest, NextResponse } from "next/server";
import { courtServiceFetch, buildQueryString } from "@/lib/court-service";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const court_code = searchParams.get("court_code");

    if (!court_code) {
      return NextResponse.json({ error: "court_code is required" }, { status: 400 });
    }

    const qs = buildQueryString({
      court_code,
      case_type: searchParams.get("case_type"),
      case_number: searchParams.get("case_number"),
      year: searchParams.get("year"),
      bench_code: searchParams.get("bench_code") || "1",
    });

    const data = await courtServiceFetch(`/api/hc/case-status?${qs}`);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
