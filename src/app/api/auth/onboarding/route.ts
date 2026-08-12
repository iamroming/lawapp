import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { firebaseUidToUuid } from "@/lib/firebase/uid";

export async function POST(request: NextRequest) {
  let user = await verifySessionFromRequest(request);

  if (!user) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const idToken = authHeader.slice(7);
      try {
        const { getAdminAuth } = await import("@/lib/firebase/admin");
        const auth = await getAdminAuth();
        const decoded = await auth.verifyIdToken(idToken);
        user = {
          uid: decoded.uid,
          uuid: firebaseUidToUuid(decoded.uid),
          email: decoded.email ?? null,
          displayName: decoded.name ?? null,
        };
      } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { full_name, phone, firm_name, mode, invite_code } = body;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (mode === "owner") {
    const { error } = await supabase.from("profiles").upsert({
      id: user.uuid,
      full_name: full_name || "",
      email: user.email || "",
      phone: phone || "",
      firm_name: firm_name || "",
      role: "owner",
      firm_id: user.uuid,
      is_active: true,
    }, { onConflict: "id" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else if (mode === "employee") {
    if (!invite_code) {
      return NextResponse.json({ error: "Invite code required" }, { status: 400 });
    }

    const normalizedCode = (invite_code as string).trim().toUpperCase();

    const { data: invite, error: inviteError } = await supabase
      .from("team_invites")
      .select("*")
      .eq("code", normalizedCode)
      .eq("is_active", true)
      .is("used_by", null)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invalid or already used invite code" }, { status: 400 });
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invite code has expired" }, { status: 400 });
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.uuid,
      full_name: full_name || "",
      email: user.email || "",
      phone: phone || "",
      firm_name: firm_name || "",
      role: invite.role_id as string,
      firm_id: invite.firm_id as string,
      is_active: true,
      payment_type: (invite as any).payment_type || null,
      monthly_salary: (invite as any).monthly_salary || null,
      percentage_rate: (invite as any).percentage_rate || null,
      upi_id: (invite as any).upi_id || null,
      allotment_status: (invite as any).allotment_status || null,
      pf_enabled: (invite as any).pf_enabled ?? null,
      esi_enabled: (invite as any).esi_enabled ?? null,
      tds_rate: (invite as any).tds_rate || null,
    }, { onConflict: "id" });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    await supabase
      .from("team_invites")
      .update({
        used_by: user.uuid,
        used_at: new Date().toISOString(),
        is_active: false,
      })
      .eq("id", invite.id as string);
  } else {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
