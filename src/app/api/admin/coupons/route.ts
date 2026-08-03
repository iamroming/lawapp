import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function checkSuperAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 };
  const { data } = await supabase.from("super_admins").select("id").eq("id", user.id).single();
  if (!data) return { error: "Forbidden", status: 403 };
  return { user };
}

export async function GET() {
  const supabase = await createClient();
  const auth = await checkSuperAdmin(supabase);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await supabase
    .from("coupon_codes")
    .select("*, plan:subscription_plans(id, name, slug), creator:profiles!coupon_codes_created_by_fkey(full_name)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const coupons = (data || []).map((c: any) => ({
    ...c,
    plan: Array.isArray(c.plan) ? c.plan[0] : c.plan,
    creator: Array.isArray(c.creator) ? c.creator[0] : c.creator,
  }));

  return NextResponse.json(coupons);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const auth = await checkSuperAdmin(supabase);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const { code, plan_id, discount_type, discount_value, max_uses, valid_from, valid_until, description } = body;

  if (!code || !discount_type) {
    return NextResponse.json({ error: "Code and discount_type are required" }, { status: 400 });
  }

  if (!["percent", "fixed", "free"].includes(discount_type)) {
    return NextResponse.json({ error: "discount_type must be percent, fixed, or free" }, { status: 400 });
  }

  const finalCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "");

  // Check for duplicate
  const { data: existing } = await supabase.from("coupon_codes").select("id").eq("code", finalCode).limit(1);
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("coupon_codes")
    .insert({
      code: finalCode,
      plan_id: plan_id || null,
      discount_type,
      discount_value: discount_value || 0,
      max_uses: max_uses ?? -1,
      valid_from: valid_from || new Date().toISOString(),
      valid_until: valid_until || null,
      description: description || null,
      created_by: auth.user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
