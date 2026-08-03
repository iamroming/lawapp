import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entity_type");
  const entityId = searchParams.get("entity_id");

  let query = supabase
    .from("audit_logs")
    .select("*, user:profiles(full_name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

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
