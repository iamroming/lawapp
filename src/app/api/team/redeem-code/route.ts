import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { checkUserLimit } from "@/lib/subscription-limits";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { code } = body;

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
  }

  const normalizedCode = code.trim().toUpperCase();

  const { data: invite, error: fetchError } = await supabase
    .from("team_invites")
    .select("*")
    .eq("code", normalizedCode)
    .eq("is_active", true)
    .is("used_by", null)
    .single();

  if (fetchError || !invite) {
    return NextResponse.json({ error: "Invalid or already used invite code" }, { status: 400 });
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invite code has expired" }, { status: 400 });
  }

  // Check if user already belongs to a firm
  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("firm_id, role")
    .eq("id", user.uuid)
    .single();

  if (currentUserProfile?.firm_id && currentUserProfile.firm_id !== invite.firm_id) {
    return NextResponse.json({
      error: "You already belong to a firm. Leave your current firm before joining a new one.",
    }, { status: 400 });
  }

  // Check subscription user limit for the firm (use firm owner's ID, not employee's)
  const { count: memberCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("firm_id", invite.firm_id)
    .eq("is_active", true);
  const userLimitCheck = await checkUserLimit(invite.firm_id, memberCount || 0);
  if (!userLimitCheck.allowed) {
    return NextResponse.json({
      error: userLimitCheck.message,
      limit: userLimitCheck.limit,
      plan: userLimitCheck.plan,
      upgradeRequired: true,
    }, { status: 403 });
  }

  const { error: updateError } = await supabase
    .from("team_invites")
    .update({
      used_by: user.uuid,
      used_at: new Date().toISOString(),
      is_active: false,
    })
    .eq("id", invite.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      role: invite.role_id,
      firm_id: invite.firm_id,
      payment_type: invite.payment_type || null,
      monthly_salary: invite.monthly_salary || null,
      percentage_rate: invite.percentage_rate || null,
      upi_id: invite.upi_id || null,
      allotment_status: invite.allotment_status || null,
      pf_enabled: invite.pf_enabled ?? null,
      esi_enabled: invite.esi_enabled ?? null,
      tds_rate: invite.tds_rate || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.uuid);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Assign employee to branch if invite has branch_id
  if (invite.branch_id) {
    await supabase.from("employee_branches").insert({
      employee_id: user.uuid,
      branch_id: invite.branch_id,
      is_primary: true,
    });
  }

  // Notify the employee they joined a firm
  await supabase.from("notifications").insert({
    user_id: user.uuid,
    type: "team_joined",
    title: "You've joined a firm",
    message: `You have joined as ${invite.role_id.replace(/_/g, " ")} using an invite code.`,
    read: false,
  });

  return NextResponse.json({
    success: true,
    role: invite.role_id,
    firm_id: invite.firm_id,
  });
}

export async function GET(request: NextRequest) {
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const normalizedCode = code.trim().toUpperCase();

  const { data: invite } = await supabase
    .from("team_invites")
    .select("role_id, firm_id, expires_at, email")
    .eq("code", normalizedCode)
    .eq("is_active", true)
    .is("used_by", null)
    .single();

  if (!invite) {
    return NextResponse.json({ valid: false, error: "Invalid or already used code" });
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: "Code has expired" });
  }

  return NextResponse.json({ valid: true, role_id: invite.role_id });
}
