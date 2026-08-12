import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { getPlanLimits } from "@/lib/subscription-limits";

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

  const { data } = await supabase
    .from("documents")
    .select("file_size")
    .eq("firm_id", firmId)
    .is("deleted_at", null);

  const usedBytes = (data || []).reduce(
    (sum: number, doc: { file_size: number | null }) => sum + (doc.file_size || 0),
    0
  );

  const limits = await getPlanLimits(user.uuid);
  const limitBytes = limits.max_storage_mb === -1
    ? -1
    : limits.max_storage_mb * 1024 * 1024;

  return NextResponse.json({
    used: usedBytes,
    usedMB: Math.round(usedBytes / (1024 * 1024)),
    limit: limits.max_storage_mb,
    limitBytes,
    plan: limits.plan_name,
    allowed: limits.max_storage_mb === -1 || usedBytes < limitBytes,
  });
}
