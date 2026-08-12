import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { checkCaseLimit } from "@/lib/subscription-limits";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.uuid)
    .single();

  const firmId = profile?.firm_id || user.uuid;

  const { count } = await supabase
    .from("cases")
    .select("id", { count: "exact", head: true })
    .eq("firm_id", firmId)
    .is("deleted_at", null);

  const limitCheck = await checkCaseLimit(user.uuid, count || 0);

  return NextResponse.json({
    used: count || 0,
    limit: limitCheck.limit,
    plan: limitCheck.plan,
    allowed: limitCheck.allowed,
    message: limitCheck.message,
  });
}
