import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { confirm_email } = body;

    // Verify email confirmation
    if (confirm_email !== user.email) {
      return NextResponse.json({ error: "Email confirmation does not match" }, { status: 400 });
    }

    // Soft-delete profile (mark as inactive, clear sensitive data)
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        is_active: false,
        full_name: "Deleted User",
        email: `deleted_${user.id}@removed.local`,
        phone: "",
        firm_name: "",
        deleted_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("Profile deletion error:", profileError.message);
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }

    // Actually delete user from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(user.id);

    // Log the deletion
    await supabase.rpc("log_activity", {
      p_user_id: user.id,
      p_action: "account_deleted",
      p_entity_type: "profile",
      p_entity_id: user.id,
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
