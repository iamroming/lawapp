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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const auth = await checkSuperAdmin(request, supabase);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;

  const { data, error } = await supabase
    .from("coupon_uses")
    .select("*, user:profiles(full_name, email), plan:subscription_plans(name)")
    .eq("coupon_id", id)
    .order("used_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const uses = (data || []).map((u: any) => ({
    ...u,
    user: Array.isArray(u.user) ? u.user[0] : u.user,
    plan: Array.isArray(u.plan) ? u.plan[0] : u.plan,
  }));

  return NextResponse.json(uses);
}
