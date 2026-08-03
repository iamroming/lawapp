import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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

  const { error: updateError } = await supabase
    .from("team_invites")
    .update({
      used_by: user.id,
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
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    role: invite.role_id,
    firm_id: invite.firm_id,
  });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const normalizedCode = code.trim().toUpperCase();

  const { data: invite } = await supabase
    .from("team_invites")
    .select("role_id, firm_id, expires_at")
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

  return NextResponse.json({ valid: true });
}
