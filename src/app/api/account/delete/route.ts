import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { getAdminAuth } from "@/lib/firebase/admin";

export async function DELETE(request: Request) {
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { confirm_email } = body;

    if (confirm_email !== user.email) {
      return NextResponse.json({ error: "Email confirmation does not match" }, { status: 400 });
    }

    const supabase = await createClient();

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        is_active: false,
        full_name: "Deleted User",
        email: `deleted_${user.uid}@removed.local`,
        phone: "",
        firm_name: "",
        deleted_at: new Date().toISOString(),
      })
      .eq("id", user.uuid);

    if (profileError) {
      console.error("Profile deletion error:", profileError.message);
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }

    try {
      await (await getAdminAuth()).revokeRefreshTokens(user.uid);
    } catch (signOutErr) {
      console.error("Session invalidation warning:", signOutErr);
    }

    try {
      await (await getAdminAuth()).deleteUser(user.uid);
    } catch (authError: any) {
      console.error("Auth deletion error:", authError.message);
    }

    await supabase.rpc("log_activity", {
      p_user_id: user.uuid,
      p_action: "account_deleted",
      p_entity_type: "profile",
      p_entity_id: user.uuid,
      p_entity_name: "Self-deleted account",
      p_details: { reason: "user_request", dpdp_compliance: true },
    });

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully. Your data has been anonymized per DPDP Act compliance.",
    });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
