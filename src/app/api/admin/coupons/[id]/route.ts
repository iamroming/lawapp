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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const auth = await checkSuperAdmin(request, supabase);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.code !== undefined) {
    const newCode = body.code.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const { data: existing } = await supabase
      .from("coupon_codes")
      .select("id")
      .eq("code", newCode)
      .neq("id", id)
      .single();
    if (existing) {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
    }
    updates.code = newCode;
  }
  if (body.plan_id !== undefined) updates.plan_id = body.plan_id || null;
  if (body.discount_type !== undefined) {
    if (!["percent", "fixed", "free"].includes(body.discount_type)) {
      return NextResponse.json({ error: "discount_type must be one of: percent, fixed, free" }, { status: 400 });
    }
    updates.discount_type = body.discount_type;
  }
  if (body.discount_value !== undefined) updates.discount_value = body.discount_value;
  if (body.max_uses !== undefined) updates.max_uses = body.max_uses;
  if (body.valid_from !== undefined) updates.valid_from = body.valid_from;
  if (body.valid_until !== undefined) updates.valid_until = body.valid_until;
  if (body.is_active !== undefined) updates.is_active = body.is_active;
  if (body.description !== undefined) updates.description = body.description;

  const { data, error } = await supabase
    .from("coupon_codes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const auth = await checkSuperAdmin(request, supabase);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const { error } = await supabase.from("coupon_codes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
