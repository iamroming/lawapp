import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

async function checkSuperAdmin(request: NextRequest, supabase: any) {
  const user = await verifySessionFromRequest(request);
  if (!user) return { error: "Unauthorized", status: 401 };
  const { data } = await supabase.from("super_admins").select("id").eq("id", user.uuid).single();
  if (!data) return { error: "Forbidden", status: 403 };
  return { user };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await checkSuperAdmin(request, supabase);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const { user_id, plan_id, status, custom_price, discount_percent, expires_at, reason } = body;

  if (!user_id) return NextResponse.json({ error: "user_id is required" }, { status: 400 });

  if (custom_price !== undefined && (typeof custom_price !== "number" || custom_price <= 0)) {
    return NextResponse.json({ error: "custom_price must be a positive number" }, { status: 400 });
  }
  if (discount_percent !== undefined && (typeof discount_percent !== "number" || discount_percent < 0 || discount_percent > 100)) {
    return NextResponse.json({ error: "discount_percent must be between 0 and 100" }, { status: 400 });
  }
  if (expires_at && new Date(expires_at) <= new Date()) {
    return NextResponse.json({ error: "expires_at must be in the future" }, { status: 400 });
  }

  // Find existing subscription or create new one
  const { data: existing } = await supabase
    .from("user_subscriptions")
    .select("id")
    .eq("user_id", user_id)
    .in("status", ["active", "trialing", "cancelled"])
    .limit(1)
    .single();

  const updateData: Record<string, unknown> = {
    overridden_by: auth.user.uuid,
    overridden_at: new Date().toISOString(),
    override_reason: reason || "Admin override",
  };

  if (plan_id) updateData.plan_id = plan_id;
  if (status) updateData.status = status;
  if (custom_price !== undefined) updateData.custom_price = custom_price;
  if (discount_percent !== undefined) updateData.discount_percent = discount_percent;
  if (expires_at) updateData.expires_at = expires_at;

  let result;
  if (existing) {
    result = await supabase.from("user_subscriptions").update(updateData).eq("id", existing.id).select().single();
  } else {
    updateData.user_id = user_id;
    updateData.starts_at = new Date().toISOString();
    updateData.status = status || "active";
    result = await supabase.from("user_subscriptions").insert(updateData).select().single();
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });

  // Log activity
  await supabase.rpc("log_activity", {
    p_user_id: auth.user.uuid,
    p_action: "overridden",
    p_entity_type: "subscription",
    p_entity_id: result.data.id,
    p_entity_name: `Subscription for user ${user_id}`,
    p_details: { plan_id, status, custom_price, discount_percent, reason },
  });

  return NextResponse.json(result.data);
}
