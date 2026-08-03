import { createClient } from "@/lib/supabase/server";

export interface TrialStatus {
  isTrialing: boolean;
  daysRemaining: number;
  expiresAt: string | null;
  isExpired: boolean;
  planName: string | null;
}

export async function checkTrialStatus(userId: string): Promise<TrialStatus> {
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("status, expires_at, plan:subscription_plans(name)")
    .eq("user_id", userId)
    .single();

  if (!subscription || subscription.status !== "trialing") {
    return {
      isTrialing: false,
      daysRemaining: 0,
      expiresAt: null,
      isExpired: false,
      planName: null,
    };
  }

  const expiresAt = new Date(subscription.expires_at);
  const now = new Date();
  const diffMs = expiresAt.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isExpired = diffMs <= 0;

  const plan = Array.isArray(subscription.plan) ? subscription.plan[0] : subscription.plan;

  return {
    isTrialing: true,
    daysRemaining,
    expiresAt: subscription.expires_at,
    isExpired,
    planName: plan?.name || null,
  };
}

export async function expireTrials(): Promise<number> {
  const supabase = await createClient();

  const { data: expiredTrials, error } = await supabase
    .from("user_subscriptions")
    .update({ status: "expired" })
    .eq("status", "trialing")
    .lt("expires_at", new Date().toISOString())
    .select("id");

  if (error) {
    console.error("Failed to expire trials:", error);
    return 0;
  }

  return expiredTrials?.length || 0;
}
