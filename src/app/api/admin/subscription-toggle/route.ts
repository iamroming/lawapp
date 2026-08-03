import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function checkSuperAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 };
  const { data } = await supabase.from("super_admins").select("id").eq("id", user.id).single();
  if (!data) return { error: "Forbidden", status: 403 };
  return { user };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await checkSuperAdmin(supabase);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const { user_ids, enabled, reason } = body;

  if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
    return NextResponse.json({ error: "user_ids array is required" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {
    is_enabled: enabled,
    overridden_by: auth.user.id,
    overridden_at: new Date().toISOString(),
    override_reason: reason || (enabled ? "Re-enabled by admin" : "Disabled by admin"),
  };

  if (!enabled) {
    updateData.disabled_at = new Date().toISOString();
    updateData.disabled_reason = reason || "Disabled by admin";
  } else {
    updateData.disabled_at = null;
    updateData.disabled_reason = null;
  }

  const { data, error } = await supabase
    .from("user_subscriptions")
    .update(updateData)
    .in("user_id", user_ids)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log activity
  await supabase.rpc("log_activity", {
    p_user_id: auth.user.id,
    p_action: enabled ? "enabled" : "disabled",
    p_entity_type: "subscription",
    p_entity_id: null,
    p_entity_name: `${enabled ? "Enabled" : "Disabled"} ${user_ids.length} subscriptions`,
    p_details: { user_ids, reason },
  });

  return NextResponse.json({ success: true, updated: data?.length || 0 });
}
