import { createClient } from "./supabase/server";

export interface PlanLimits {
  max_cases: number;
  max_users: number;
  max_storage_mb: number;
  max_ai_queries: number;
  plan_name: string;
}

const FREE_PLAN: PlanLimits = {
  max_cases: 3,
  max_users: 1,
  max_storage_mb: 100,
  max_ai_queries: 5,
  plan_name: "Free",
};

export async function getPlanLimits(userId: string): Promise<PlanLimits> {
  const supabase = await createClient();

  // Get user's firm_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", userId)
    .single();

  const lookupId = profile?.firm_id || userId;

  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("plan:subscription_plans(name, max_cases, max_users, max_storage_mb)")
    .eq("user_id", lookupId)
    .eq("status", "active")
    .single();

  if (!subscription?.plan) return FREE_PLAN;

  const plan = Array.isArray(subscription.plan) ? subscription.plan[0] : subscription.plan;
  if (!plan) return FREE_PLAN;

  return {
    max_cases: plan.max_cases ?? FREE_PLAN.max_cases,
    max_users: plan.max_users ?? FREE_PLAN.max_users,
    max_storage_mb: plan.max_storage_mb ?? FREE_PLAN.max_storage_mb,
    max_ai_queries: FREE_PLAN.max_ai_queries,
    plan_name: plan.name || "Unknown",
  };
}

export async function checkCaseLimit(
  userId: string,
  currentCaseCount: number
): Promise<{ allowed: boolean; limit: number; plan: string; message?: string }> {
  const limits = await getPlanLimits(userId);

  if (limits.max_cases === -1) {
    return { allowed: true, limit: -1, plan: limits.plan_name };
  }

  if (currentCaseCount >= limits.max_cases) {
    return {
      allowed: false,
      limit: limits.max_cases,
      plan: limits.plan_name,
      message: `You've reached your ${limits.plan_name} plan limit of ${limits.max_cases} cases. Upgrade your plan to add more cases.`,
    };
  }

  return { allowed: true, limit: limits.max_cases, plan: limits.plan_name };
}

export async function checkUserLimit(
  userId: string,
  currentUserCount: number
): Promise<{ allowed: boolean; limit: number; plan: string; message?: string }> {
  const limits = await getPlanLimits(userId);

  if (limits.max_users === -1) {
    return { allowed: true, limit: -1, plan: limits.plan_name };
  }

  if (currentUserCount >= limits.max_users) {
    return {
      allowed: false,
      limit: limits.max_users,
      plan: limits.plan_name,
      message: `You've reached your ${limits.plan_name} plan limit of ${limits.max_users} users. Upgrade your plan to add more team members.`,
    };
  }

  return { allowed: true, limit: limits.max_users, plan: limits.plan_name };
}

export async function checkStorageLimit(
  userId: string,
  currentStorageBytes: number
): Promise<{ allowed: boolean; limit: number; used: number; plan: string; message?: string }> {
  const limits = await getPlanLimits(userId);
  const currentMB = Math.round(currentStorageBytes / (1024 * 1024));

  if (limits.max_storage_mb === -1) {
    return { allowed: true, limit: -1, used: currentMB, plan: limits.plan_name };
  }

  if (currentMB >= limits.max_storage_mb) {
    return {
      allowed: false,
      limit: limits.max_storage_mb,
      used: currentMB,
      plan: limits.plan_name,
      message: `You've reached your ${limits.plan_name} plan storage limit of ${limits.max_storage_mb} MB. Upgrade your plan or purchase additional storage.`,
    };
  }

  const warningThreshold = limits.max_storage_mb * 0.8;
  if (currentMB >= warningThreshold) {
    return {
      allowed: true,
      limit: limits.max_storage_mb,
      used: currentMB,
      plan: limits.plan_name,
      message: `You're using ${currentMB} MB of ${limits.max_storage_mb} MB (${Math.round((currentMB / limits.max_storage_mb) * 100)}%). Consider upgrading your plan.`,
    };
  }

  return { allowed: true, limit: limits.max_storage_mb, used: currentMB, plan: limits.plan_name };
}

export async function getUsageStats(userId: string) {
  const supabase = await createClient();
  const limits = await getPlanLimits(userId);

  // Get user's firm_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", userId)
    .single();

  const firmId = profile?.firm_id;

  const [casesResult, usersResult, storageResult] = await Promise.all([
    supabase
      .from("cases")
      .select("id", { count: "exact", head: true })
      .eq("firm_id", firmId || userId)
      .is("deleted_at", null),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("firm_id", firmId || userId)
      .eq("is_active", true),
    supabase
      .from("documents")
      .select("file_size")
      .eq("firm_id", firmId || userId)
      .is("deleted_at", null),
  ]);

  const totalStorageBytes = (storageResult.data || []).reduce(
    (sum, doc) => sum + (doc.file_size || 0),
    0
  );

  return {
    cases: {
      used: casesResult.count || 0,
      limit: limits.max_cases,
      plan: limits.plan_name,
    },
    users: {
      used: usersResult.count || 0,
      limit: limits.max_users,
      plan: limits.plan_name,
    },
    storage: {
      used: totalStorageBytes,
      usedMB: Math.round(totalStorageBytes / (1024 * 1024)),
      limit: limits.max_storage_mb,
      plan: limits.plan_name,
    },
  };
}

export async function checkAiQueryLimit(
  userId: string
): Promise<{ allowed: boolean; limit: number; used: number; plan: string; message?: string }> {
  const limits = await getPlanLimits(userId);
  const supabase = await createClient();

  // Count AI queries in the last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", oneDayAgo);

  const used = count || 0;

  if (limits.max_ai_queries === -1) {
    return { allowed: true, limit: -1, used, plan: limits.plan_name };
  }

  if (used >= limits.max_ai_queries) {
    return {
      allowed: false,
      limit: limits.max_ai_queries,
      used,
      plan: limits.plan_name,
      message: `You've reached your ${limits.plan_name} plan limit of ${limits.max_ai_queries} AI queries per day. Upgrade your plan for more.`,
    };
  }

  return { allowed: true, limit: limits.max_ai_queries, used, plan: limits.plan_name };
}

export async function logAiQuery(userId: string, queryType: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("ai_usage").insert({
    user_id: userId,
    query_type: queryType,
    created_at: new Date().toISOString(),
  });
}
