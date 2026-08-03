import { createClient } from "./client";
import { createClient as createServerClient } from "./server";
import type { Case, Client, Profile, Hearing, Document, Invoice, Payment, TimeEntry, Note } from "@/types/database";

function flattenRelation<T>(data: T | T[] | null): T | null {
  if (!data) return null;
  if (Array.isArray(data)) return data[0] || null;
  return data;
}

function flattenRelations<T>(data: T[] | null): T[] {
  if (!data) return [];
  return data;
}

// Client queries
export async function getClients(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .is("deleted_at", null)
    .eq("created_by", userId)
    .order("full_name");
  return { data: flattenRelations<Client>(data), error };
}

export async function getClient(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  return { data: data as Client | null, error };
}

export async function createClientRecord(client: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) {
  const supabase = createClient();
  const { data, error } = await supabase.from("clients").insert(client).select().single();
  return { data: data as Client | null, error };
}

export async function updateClient(id: string, updates: Partial<Client>) {
  const supabase = createClient();
  const { data, error } = await supabase.from("clients").update(updates).eq("id", id).select().single();
  return { data: data as Client | null, error };
}

export async function deleteClient(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("clients").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  return { error };
}

// Case queries
export async function getCases(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cases")
    .select("*, client:clients(*), assigned:profiles!cases_assigned_to_fkey(full_name, email, avatar_url), creator:profiles!cases_created_by_fkey(full_name)")
    .is("deleted_at", null)
    .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
    .order("created_at", { ascending: false });
  const cases = (data || []).map((c: any) => ({
    ...c,
    client: flattenRelation(c.client),
    assigned: flattenRelation(c.assigned),
    creator: flattenRelation(c.creator),
  }));
  return { data: cases as Case[], error };
}

export async function getCase(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cases")
    .select("*, client:clients(*), assigned:profiles!cases_assigned_to_fkey(*), creator:profiles!cases_created_by_fkey(full_name)")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (data) {
    data.client = flattenRelation(data.client);
    data.assigned = flattenRelation(data.assigned);
  }
  return { data: data as Case | null, error };
}

export async function createCaseRecord(caseData: Record<string, unknown>) {
  const supabase = createClient();
  const { data, error } = await supabase.from("cases").insert(caseData).select().single();
  return { data, error };
}

export async function updateCase(id: string, updates: Record<string, unknown>) {
  const supabase = createClient();
  const { data, error } = await supabase.from("cases").update(updates).eq("id", id).select().single();
  return { data, error };
}

export async function deleteCase(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("cases").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  return { error };
}

// Hearing queries
export async function getHearings(caseId?: string) {
  const supabase = createClient();
  let query = supabase
    .from("hearings")
    .select("*, case:cases(id, case_number, title, status)")
    .is("deleted_at", null)
    .order("hearing_date", { ascending: false });
  if (caseId) query = query.eq("case_id", caseId);
  const { data, error } = await query;
  const hearings = (data || []).map((h: any) => ({ ...h, case: flattenRelation(h.case) }));
  return { data: hearings as Hearing[], error };
}

export async function getUpcomingHearings(userId: string, limit = 10) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("hearings")
    .select("*, case:cases!hearings_case_id_fkey(id, case_number, title, status, created_by, assigned_to)")
    .is("deleted_at", null)
    .is("is_completed", false)
    .gte("hearing_date", new Date().toISOString())
    .order("hearing_date")
    .limit(limit);
  const hearings = (data || []).map((h: any) => ({ ...h, case: flattenRelation(h.case) }));
  return { data: hearings as Hearing[], error };
}

// Document queries
export async function getDocuments(caseId?: string) {
  const supabase = createClient();
  let query = supabase
    .from("documents")
    .select("*, case:cases(id, case_number, title), uploader:profiles(full_name)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (caseId) query = query.eq("case_id", caseId);
  const { data, error } = await query;
  const docs = (data || []).map((d: any) => ({
    ...d,
    case: flattenRelation(d.case),
    uploader: flattenRelation(d.uploader),
  }));
  return { data: docs as Document[], error };
}

// Invoice queries
export async function getInvoices(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*, client:clients(full_name), case:cases(title, case_number)")
    .eq("issued_by", userId)
    .order("created_at", { ascending: false });
  const invoices = (data || []).map((i: any) => ({
    ...i,
    client: flattenRelation(i.client),
    case: flattenRelation(i.case),
  }));
  return { data: invoices as Invoice[], error };
}

// Payment queries
export async function getPayments(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*, client:clients(full_name), case:cases(title)")
    .eq("received_by", userId)
    .order("payment_date", { ascending: false });
  const payments = (data || []).map((p: any) => ({
    ...p,
    client: flattenRelation(p.client),
    case: flattenRelation(p.case),
  }));
  return { data: payments as Payment[], error };
}

// Time entry queries
export async function getTimeEntries(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("time_entries")
    .select("*, case:cases(title, case_number)")
    .eq("lawyer_id", userId)
    .order("date", { ascending: false });
  const entries = (data || []).map((e: any) => ({ ...e, case: flattenRelation(e.case) }));
  return { data: entries as TimeEntry[], error };
}

// Audit trail
export async function logAudit(params: {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}) {
  const supabase = createClient();
  await supabase.from("audit_logs").insert({
    user_id: params.userId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    entity_name: params.entityName,
    old_values: params.oldValues,
    new_values: params.newValues,
  });
}

// Profile queries
export async function getProfile(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return { data: data as Profile | null, error };
}

export async function isSuperAdmin(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("super_admins")
    .select("id, access_level")
    .eq("id", userId)
    .single();
  return !!data;
}

export async function isAdmin(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return data?.role === "admin";
}
