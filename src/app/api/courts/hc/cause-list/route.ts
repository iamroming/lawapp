import { NextRequest, NextResponse } from "next/server";
import { courtServiceFetch, buildQueryString } from "@/lib/court-service";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);

    const qs = buildQueryString({
      court_code: searchParams.get("court_code"),
      civil: searchParams.get("civil") || "true",
      bench_code: searchParams.get("bench_code") || "1",
      causelist_date: searchParams.get("causelist_date") || "",
    });

    const data = await courtServiceFetch(`/api/hc/cause-list?${qs}`);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ data: [], error: error.message }, { status: 200 });
  }
}
