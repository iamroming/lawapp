import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entity_type");
  const entityId = searchParams.get("entity_id");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, firm_id")
    .eq("id", user.uuid)
    .single();

  const isOwner = ["owner", "partner", "super_admin"].includes(profile?.role || "");
  const firmId = profile?.firm_id;

  let query = supabase
    .from("security_audit_log")
    .select("*, user:profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (isOwner && firmId) {
    query = query.eq("firm_id", firmId);
  } else {
    query = query.eq("user_id", user.uuid);
  }

  if (entityType) query = query.eq("entity_type", entityType);
  if (entityId) query = query.eq("entity_id", entityId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const logs = (data || []).map((l: any) => ({
    ...l,
    user: Array.isArray(l.user) ? l.user[0] : l.user,
  }));
  return NextResponse.json(logs);
}
