import { createClient } from "./supabase/server";

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("super_admins")
    .select("id, access_level")
    .eq("id", userId)
    .single();
  return !!data;
}

export async function isSuperAdminByEmail(email: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("super_admins")
    .select("id, access_level")
    .eq("email", email)
    .single();
  return !!data;
}
