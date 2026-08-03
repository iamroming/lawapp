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
  const { user_ids, discount_percent, expires_at } = body;

  if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
    return NextResponse.json({ error: "user_ids array is required" }, { status: 400 });
  }

  if (discount_percent === undefined || discount_percent < 0 || discount_percent > 100) {
    return NextResponse.json({ error: "discount_percent must be between 0 and 100" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {
    discount_percent,
    overridden_by: auth.user.id,
    overridden_at: new Date().toISOString(),
    override_reason: `Bulk discount: ${discount_percent}%`,
  };

  if (expires_at) updateData.expires_at = expires_at;

  const { data, error } = await supabase
    .from("user_subscriptions")
    .update(updateData)
    .in("user_id", user_ids)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.rpc("log_activity", {
    p_user_id: auth.user.id,
    p_action: "discounted",
    p_entity_type: "subscription",
    p_entity_id: null,
    p_entity_name: `Applied ${discount_percent}% discount to ${user_ids.length} users`,
    p_details: { user_ids, discount_percent, expires_at },
  });

  return NextResponse.json({ success: true, updated: data?.length || 0 });
}
