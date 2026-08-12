import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { checkUserLimit } from "@/lib/subscription-limits";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(request);
  const { allowed } = await checkRateLimit(`team-invite-code:${user.uuid}:${ip}`, { windowMs: 3600000, maxRequests: 10 });
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Max 10 codes per hour." }, { status: 429 });
  }

  const body = await request.json();
  const { role_id, email, payment_type, allotment_status, upi_id, monthly_salary, percentage_rate, pf_enabled, esi_enabled, tds_rate, branch_id, expiresInDays = 7 } = body;

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
  }

  const validRoles = ["partner", "senior_associate", "associate", "junior_associate", "paralegal", "intern", "office_admin"];
  if (!role_id || !validRoles.includes(role_id)) {
    return NextResponse.json({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, firm_id")
    .eq("id", user.uuid)
    .single();

  const allowedRoles = ["owner", "partner", "super_admin"];
  if (!profile?.role || !allowedRoles.includes(profile.role)) {
    return NextResponse.json({ error: "Only owners and partners can generate invite codes" }, { status: 403 });
  }

  // Check subscription user limit
  const firmId = profile.firm_id || user.uuid;
  const { count: memberCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("firm_id", firmId)
    .eq("is_active", true);
  const userLimitCheck = await checkUserLimit(firmId, memberCount || 0);
  if (!userLimitCheck.allowed) {
    const isOwnerOrPartner = profile.role === "owner" || profile.role === "partner";
    const message = isOwnerOrPartner
      ? `You've reached your ${userLimitCheck.plan} plan limit of ${userLimitCheck.limit} team members. Upgrade your plan to add more.`
      : `Your firm has reached the ${userLimitCheck.plan} plan limit of ${userLimitCheck.limit} team members. Contact your firm owner to upgrade.`;
    return NextResponse.json({
      error: message,
      limit: userLimitCheck.limit,
      plan: userLimitCheck.plan,
      upgradeRequired: true,
    }, { status: 403 });
  }

  const code = generateCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const { error } = await supabase.from("team_invites").insert({
    code,
    role_id,
    email: email.trim().toLowerCase(),
    payment_type: payment_type || "fixed_salary",
    allotment_status: allotment_status || "allotted",
    upi_id: upi_id || null,
    monthly_salary: monthly_salary || 0,
    percentage_rate: percentage_rate || 0,
    pf_enabled: pf_enabled || false,
    esi_enabled: esi_enabled || false,
    tds_rate: tds_rate || 0,
    branch_id: branch_id || null,
    created_by: user.uuid,
    firm_id: firmId,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, code, role_id, email: email.trim().toLowerCase(), expires_at: expiresAt.toISOString() });
}
