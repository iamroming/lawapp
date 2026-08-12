"use server";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { verifySession } from "@/lib/firebase/auth";
import { getAdminAuth } from "@/lib/firebase/admin";

export async function checkSuperAdminAccess() {
  const user = await verifySession();

  if (!user) {
    return { authorized: false, reason: "unauthenticated" } as const;
  }

  const serviceRoleClient = createServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("super_admins")
    .select("id, access_level")
    .eq("id", user.uuid)
    .single();

  if (error || !data) {
    return { authorized: false, reason: "not_super_admin" } as const;
  }

  return { authorized: true, accessLevel: data.access_level } as const;
}

export async function getSuperAdminStats() {
  const access = await checkSuperAdminAccess();
  if (!access.authorized) throw new Error("Unauthorized");

  const serviceRoleClient = createServiceRoleClient();

  const [usersRes, casesRes, clientsRes, subsRes, paymentsRes, signupsRes, casesListRes] = await Promise.all([
    serviceRoleClient.from("profiles").select("id", { count: "exact", head: true }),
    serviceRoleClient.from("cases").select("id", { count: "exact", head: true }),
    serviceRoleClient.from("clients").select("id", { count: "exact", head: true }),
    serviceRoleClient.from("user_subscriptions").select("id, status"),
    serviceRoleClient.from("payments").select("amount"),
    serviceRoleClient.from("profiles").select("id, full_name, email, role, created_at").order("created_at", { ascending: false }).limit(5),
    serviceRoleClient.from("cases").select("id, title, case_number, status, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const subs = subsRes.data || [];
  const activeSubs = subs.filter((s) => s.status === "active" || s.status === "trialing");

  const breakdown: Record<string, number> = {};
  subs.forEach((s) => { breakdown[s.status] = (breakdown[s.status] || 0) + 1; });

  return {
    totalUsers: usersRes.count || 0,
    totalCases: casesRes.count || 0,
    totalClients: clientsRes.count || 0,
    totalRevenue: (paymentsRes.data || []).reduce((sum: number, p: { amount?: number }) => sum + (p.amount || 0), 0),
    activeSubscriptions: activeSubs.length,
    recentSignups: signupsRes.data || [],
    recentCases: casesListRes.data || [],
    subscriptionBreakdown: Object.entries(breakdown).map(([status, count]) => ({ status, count })),
  };
}

export async function getSuperAdminUsers() {
  const access = await checkSuperAdminAccess();
  if (!access.authorized) throw new Error("Unauthorized");

  const serviceRoleClient = createServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getSuperAdminUser(userId: string) {
  const serviceRoleClient = createServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function getSuperAdminCases() {
  const access = await checkSuperAdminAccess();
  if (!access.authorized) throw new Error("Unauthorized");

  const serviceRoleClient = createServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("cases")
    .select("*, profiles!cases_created_by_fkey(full_name, email)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getSuperAdminClients() {
  const access = await checkSuperAdminAccess();
  if (!access.authorized) throw new Error("Unauthorized");

  const serviceRoleClient = createServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getSuperAdminSubscriptions() {
  const access = await checkSuperAdminAccess();
  if (!access.authorized) throw new Error("Unauthorized");

  const serviceRoleClient = createServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("user_subscriptions")
    .select("*, profiles!user_subscriptions_user_id_fkey(full_name, email)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getSuperAdminRevenue() {
  const access = await checkSuperAdminAccess();
  if (!access.authorized) throw new Error("Unauthorized");

  const serviceRoleClient = createServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("payments")
    .select("*, profiles!payments_received_by_fkey(full_name, email)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getSuperAdminInvoices() {
  const access = await checkSuperAdminAccess();
  if (!access.authorized) throw new Error("Unauthorized");

  const serviceRoleClient = createServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("invoices")
    .select("id, invoice_number, amount, status, created_at, client:clients(full_name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getSuperAdminDocuments() {
  const access = await checkSuperAdminAccess();
  if (!access.authorized) throw new Error("Unauthorized");

  const serviceRoleClient = createServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("documents")
    .select("*, profiles!documents_uploaded_by_fkey(full_name, email)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getSuperAdminCoupons() {
  const access = await checkSuperAdminAccess();
  if (!access.authorized) throw new Error("Unauthorized");

  const serviceRoleClient = createServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getSuperAdminActivity() {
  const access = await checkSuperAdminAccess();
  if (!access.authorized) throw new Error("Unauthorized");

  const serviceRoleClient = createServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("activity_logs")
    .select("*, profiles!activity_logs_user_id_fkey(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data;
}

export async function getSuperAdminSettings() {
  const access = await checkSuperAdminAccess();
  if (!access.authorized) throw new Error("Unauthorized");

  const serviceRoleClient = createServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("platform_settings")
    .select("*")
    .order("key");
  if (error) throw error;
  return data || [];
}

export async function updateSuperAdminUser(userId: string, updates: Record<string, unknown>) {
  const access = await checkSuperAdminAccess();
  if (!access.authorized) throw new Error("Unauthorized");

  const serviceRoleClient = createServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSuperAdminUser(userId: string) {
  const access = await checkSuperAdminAccess();
  if (!access.authorized) throw new Error("Unauthorized");

  await (await getAdminAuth()).deleteUser(userId);
}

export async function updateSuperAdminSettings(settings: Record<string, unknown>) {
  const access = await checkSuperAdminAccess();
  if (!access.authorized) throw new Error("Unauthorized");

  const serviceRoleClient = createServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("platform_settings")
    .upsert(settings, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function toggleSuperAdminUserActive(userId: string, isActive: boolean) {
  const access = await checkSuperAdminAccess();
  if (!access.authorized) throw new Error("Unauthorized");

  const serviceRoleClient = createServiceRoleClient();
  const { error } = await serviceRoleClient
    .from("profiles")
    .update({ is_active: !isActive })
    .eq("id", userId);
  if (error) throw error;
}

export async function checkIfSuperAdmin(userId: string) {
  const serviceRoleClient = createServiceRoleClient();
  const { data } = await serviceRoleClient
    .from("super_admins")
    .select("id")
    .eq("id", userId)
    .single();
  return !!data;
}

export async function changeSuperAdminUserRole(userId: string, newRole: string) {
  const access = await checkSuperAdminAccess();
  if (!access.authorized) throw new Error("Unauthorized");

  const serviceRoleClient = createServiceRoleClient();
  const { error } = await serviceRoleClient
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);
  if (error) throw error;
}

export async function getSuperAdminUserDetail(userId: string) {
  const access = await checkSuperAdminAccess();
  if (!access.authorized) throw new Error("Unauthorized");

  const serviceRoleClient = createServiceRoleClient();
  const { data, error } = await serviceRoleClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function getSuperAdminUserCases(userId: string) {
  const serviceRoleClient = createServiceRoleClient();
  const { data } = await serviceRoleClient
    .from("cases")
    .select("*")
    .eq("created_by", userId)
    .order("created_at", { ascending: false })
    .limit(10);
  return data || [];
}

export async function getSuperAdminUserActivities(userId: string) {
  const serviceRoleClient = createServiceRoleClient();
  const { data } = await serviceRoleClient
    .from("activity_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  return data || [];
}

export async function getSuperAdminUserSubscription(userId: string) {
  const serviceRoleClient = createServiceRoleClient();
  const { data } = await serviceRoleClient
    .from("user_subscriptions")
    .select("*, plan:subscription_plans(name, price)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (!data) return null;
  return {
    ...data,
    plan: data.plan && !Array.isArray(data.plan) ? data.plan : null,
  };
}

export async function softDeleteSuperAdminUser(userId: string) {
  const access = await checkSuperAdminAccess();
  if (!access.authorized) throw new Error("Unauthorized");

  const serviceRoleClient = createServiceRoleClient();
  const { error } = await serviceRoleClient
    .from("profiles")
    .update({ is_active: false })
    .eq("id", userId);
  if (error) throw error;

  await (await getAdminAuth()).deleteUser(userId);
}

export async function updateSuperAdminSubscriptionStatus(id: string, status: string) {
  const access = await checkSuperAdminAccess();
  if (!access.authorized) throw new Error("Unauthorized");

  const serviceRoleClient = createServiceRoleClient();
  const { error } = await serviceRoleClient
    .from("user_subscriptions")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

export async function toggleSuperAdminCouponActive(couponId: string, isActive: boolean) {
  const access = await checkSuperAdminAccess();
  if (!access.authorized) throw new Error("Unauthorized");

  const serviceRoleClient = createServiceRoleClient();
  const { error } = await serviceRoleClient
    .from("coupon_codes")
    .update({ is_active: !isActive })
    .eq("id", couponId);
  if (error) throw error;
}

export async function deleteSuperAdminCoupon(couponId: string) {
  const access = await checkSuperAdminAccess();
  if (!access.authorized) throw new Error("Unauthorized");

  const serviceRoleClient = createServiceRoleClient();
  const { error } = await serviceRoleClient
    .from("coupon_codes")
    .delete()
    .eq("id", couponId);
  if (error) throw error;
}

export async function getSuperAdminCouponUses(couponId: string) {
  const serviceRoleClient = createServiceRoleClient();
  const { data } = await serviceRoleClient
    .from("coupon_uses")
    .select("*, user:profiles(full_name, email), plan:subscription_plans(name)")
    .eq("coupon_id", couponId)
    .order("used_at", { ascending: false });
  return data || [];
}

export async function updateSuperAdminPlatformSetting(key: string, value: unknown) {
  const access = await checkSuperAdminAccess();
  if (!access.authorized) throw new Error("Unauthorized");

  const serviceRoleClient = createServiceRoleClient();
  const { error } = await serviceRoleClient
    .from("platform_settings")
    .update({ value })
    .eq("key", key);
  if (error) throw error;
}

export async function softDeleteSuperAdminDocument(docId: string, userId: string | null, firmId: string | null, title: string | null, fileName: string | null) {
  const access = await checkSuperAdminAccess();
  if (!access.authorized) throw new Error("Unauthorized");

  const serviceRoleClient = createServiceRoleClient();
  const now = new Date().toISOString();
  const { error } = await serviceRoleClient
    .from("documents")
    .update({ deleted_at: now })
    .eq("id", docId);
  if (error) throw error;

  await serviceRoleClient.from("security_audit_log").insert({
    user_id: userId,
    firm_id: firmId,
    action: "document.soft_delete",
    entity_type: "document",
    entity_id: docId,
    details: { title, file_name: fileName },
  });
}
