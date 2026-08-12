import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: memberId } = await params;

  if (!memberId) {
    return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
  }

  if (memberId === user.uuid) {
    return NextResponse.json({ error: "You cannot remove yourself" }, { status: 400 });
  }

  // Check if requester is owner, partner, or super_admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, firm_id")
    .eq("id", user.uuid)
    .single();

  const { data: superAdmin } = await supabase
    .from("super_admins")
    .select("id")
    .eq("id", user.uuid)
    .single();

  const allowedRemoveRoles = ["owner", "partner", "super_admin"];
  if (!profile?.role || !allowedRemoveRoles.includes(profile.role) && !superAdmin) {
    return NextResponse.json({ error: "Only owners, partners, and super admins can remove team members" }, { status: 403 });
  }

  // Check the member exists and belongs to the same firm
  const { data: member } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, firm_id")
    .eq("id", memberId)
    .single();

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (member.firm_id !== profile.firm_id) {
    return NextResponse.json({ error: "Member does not belong to your firm" }, { status: 403 });
  }

  // Prevent removing owners unless super_admin
  if (member.role === "owner" && !superAdmin) {
    return NextResponse.json({ error: "Cannot remove the firm owner. Super admin required." }, { status: 403 });
  }

  // Role hierarchy: can only remove someone with a lower (higher number) role
  const roleHierarchy: Record<string, number> = {
    owner: 0, super_admin: 0, partner: 1, senior_associate: 2,
    associate: 3, junior_associate: 4, paralegal: 5, intern: 6, office_admin: 7
  };
  const myLevel = roleHierarchy[profile?.role || ""] ?? 99;
  const theirLevel = roleHierarchy[member.role || ""] ?? 99;
  if (theirLevel <= myLevel && !superAdmin) {
    return NextResponse.json({ error: "Cannot remove someone with equal or higher role" }, { status: 403 });
  }

  // Soft-remove: disable the member (keep role/firm_id for audit trail)
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", memberId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Log activity
  await supabase.rpc("log_activity", {
    p_user_id: user.uuid,
    p_action: "removed",
    p_entity_type: "team_member",
    p_entity_id: memberId,
    p_entity_name: member.full_name || member.email,
    p_details: { previous_role: member.role },
  });

  return NextResponse.json({
    success: true,
    message: `${member.email} has been removed from the team`,
  });
}
