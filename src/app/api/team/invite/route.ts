import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { checkUserLimit } from "@/lib/subscription-limits";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: max 5 invites per hour
  const ip = getClientIp(request);
  const { allowed } = await checkRateLimit(`team-invite:${user.id}:${ip}`, { windowMs: 3600000, maxRequests: 5 });
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Max 5 invites per hour." }, { status: 429 });
  }

  const body = await request.json();
  const { email, role = "associate" } = body;

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  // Valid team roles (excluding owner and super_admin which require special handling)
  const validRoles = ["partner", "senior_associate", "associate", "junior_associate", "paralegal", "intern", "office_admin"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` }, { status: 400 });
  }

  // Check if user is owner or partner
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, firm_id")
    .eq("id", user.id)
    .single();

  const allowedInviteRoles = ["owner", "partner"];
  if (!profile?.role || !allowedInviteRoles.includes(profile.role)) {
    return NextResponse.json({ error: "Only owners and partners can invite team members" }, { status: 403 });
  }

  // Check subscription user limit
  const { count: memberCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("firm_id", profile.firm_id || user.id)
    .eq("is_active", true);
  const userLimitCheck = await checkUserLimit(user.id, memberCount || 0);
  if (!userLimitCheck.allowed) {
    return NextResponse.json({ error: userLimitCheck.message }, { status: 403 });
  }

  // Find the user by email
  const { data: inviteeProfile } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("email", email)
    .single();

  if (!inviteeProfile) {
    return NextResponse.json({ error: "No user found with this email. They must sign up first." }, { status: 404 });
  }

  if (inviteeProfile.id === user.id) {
    return NextResponse.json({ error: "You cannot invite yourself" }, { status: 400 });
  }

  // Check if invitee already belongs to another firm
  const { data: inviteeFullProfile } = await supabase
    .from("profiles")
    .select("firm_id, role")
    .eq("id", inviteeProfile.id)
    .single();

  if (inviteeFullProfile?.firm_id && inviteeFullProfile.firm_id !== profile.firm_id && inviteeFullProfile.firm_id !== user.id) {
    return NextResponse.json({ error: "This user already belongs to another firm" }, { status: 400 });
  }

  // Check if already a team member (same role or higher)
  const { data: existingMember } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", inviteeProfile.id)
    .single();

  // Prevent changing role of someone with higher or equal role
  const roleHierarchy: Record<string, number> = {
    owner: 0, super_admin: 0, partner: 1, senior_associate: 2,
    associate: 3, junior_associate: 4, paralegal: 5, intern: 6, office_admin: 7
  };
  
  const myLevel = roleHierarchy[profile?.role || ""] ?? 99;
  const theirLevel = roleHierarchy[existingMember?.role || ""] ?? 99;
  
  if (theirLevel <= myLevel && profile?.role !== "super_admin") {
    return NextResponse.json({ error: "Cannot change role of someone with equal or higher role" }, { status: 403 });
  }

  // Update the invitee's role and firm_id
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role, firm_id: profile.firm_id || user.id, updated_at: new Date().toISOString() })
    .eq("id", inviteeProfile.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Log activity
  await supabase.rpc("log_activity", {
    p_user_id: user.id,
    p_action: "invited",
    p_entity_type: "team_member",
    p_entity_id: inviteeProfile.id,
    p_entity_name: inviteeProfile.full_name || email,
    p_details: { role },
  });

  return NextResponse.json({
    success: true,
    message: `${email} has been added as ${role}`,
    member: { id: inviteeProfile.id, full_name: inviteeProfile.full_name, email: inviteeProfile.email, role },
  });
}
