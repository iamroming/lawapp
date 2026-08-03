import { NextRequest, NextResponse } from "next/server";
import { courtServiceFetch, buildQueryString } from "@/lib/court-service";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
