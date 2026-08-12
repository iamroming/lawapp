import { createClient } from "./supabase/client";
import type { UserRole } from "@/types/database";

export interface FirmContext {
  firmId: string | null;
  userId: string;
  role: UserRole;
  isOwner: boolean;
}

/**
 * Get the current user's firm context.
 * Call this at the top of any page/component that queries data.
 */
export async function getFirmContext(): Promise<FirmContext | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, firm_id")
    .eq("id", user.id)
    .single();

  const role = (profile?.role || "associate") as UserRole;
  const isOwner = role === "owner" || role === "super_admin";

  return {
    firmId: isOwner ? (profile?.firm_id || user.id) : profile?.firm_id || null,
    userId: user.id,
    role,
    isOwner,
  };
}

/**
 * Apply firm_id filter to a Supabase query builder.
 * For owners: filter by firm_id
 * For employees: filter by assigned_to or created_by
 */
export function applyFirmScope(
  ctx: FirmContext,
  query: any,
  table: string = "cases",
  opts?: { ownerField?: string; employeeField?: string }
) {
  if (ctx.isOwner) {
    return query.eq("firm_id", ctx.firmId);
  }
  // Employees see only what they created or are assigned to
  const ownerField = opts?.ownerField || "created_by";
  const employeeField = opts?.employeeField || "assigned_to";
  return query.or(`${ownerField}.eq.${ctx.userId},${employeeField}.eq.${ctx.userId}`).eq("firm_id", ctx.firmId);
}
