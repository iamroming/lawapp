"use server";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { verifySession } from "@/lib/firebase/auth";

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
