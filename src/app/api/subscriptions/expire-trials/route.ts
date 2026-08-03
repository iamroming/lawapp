import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Find expired trials
    const { data: expiredTrials, error: fetchError } = await supabase
      .from("user_subscriptions")
      .select("id, user_id, plan_id")
      .eq("status", "trialing")
      .lt("expires_at", new Date().toISOString());

    if (fetchError) {
      console.error("Failed to fetch expired trials:", fetchError.message);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!expiredTrials || expiredTrials.length === 0) {
      return NextResponse.json({ success: true, expired: 0, message: "No expired trials" });
    }

    // Expire all overdue trials
    const { error: updateError } = await supabase
      .from("user_subscriptions")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("status", "trialing")
      .lt("expires_at", new Date().toISOString());

    if (updateError) {
      console.error("Failed to expire trials:", updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log(`Expired ${expiredTrials.length} trials`);

    return NextResponse.json({
      success: true,
      expired: expiredTrials.length,
      message: `Expired ${expiredTrials.length} trials`,
    });
  } catch (error) {
    console.error("Trial expiration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
