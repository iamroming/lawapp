import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const envRaw = readFileSync(resolve(__dirname, "..", ".env.local"), "utf-8");
const env: Record<string, string> = {};
for (const line of envRaw.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx > 0) env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY is not set in .env.local");
  console.error("Get it from: Supabase Dashboard > Settings > API > service_role key");
  process.exit(1);
}

const EMAIL = "employee@test.com";
const PASSWORD = "Test@1234";

async function fixEmployee() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  console.log("Looking for existing employee@test.com user...");

  const { data: users } = await supabase.auth.admin.listUsers();
  const existing = users?.users?.find((u) => u.email === EMAIL);

  if (existing) {
    console.log(`Found existing user (id: ${existing.id}). Deleting...`);
    const { error: delErr } = await supabase.auth.admin.deleteUser(existing.id);
    if (delErr) {
      console.error("Delete error:", delErr.message);
      process.exit(1);
    }
    console.log("Deleted broken user.");

    const { error: profDelErr } = await supabase
      .from("profiles")
      .delete()
      .eq("id", existing.id);
    if (profDelErr) {
      console.log("Profile delete note:", profDelErr.message);
    }
  }

  console.log("Creating new employee user...");

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });

  if (authError) {
    console.error("Create user error:", authError.message);
    process.exit(1);
  }

  console.log(`User created (id: ${authData.user.id})`);

  const { data: ownerUsers } = await supabase.auth.admin.listUsers();
  const owner = ownerUsers?.users?.find((u) => u.email === "owner@test.com");

  const { error: profErr } = await supabase.from("profiles").upsert({
    id: authData.user.id,
    full_name: "Test Employee",
    email: EMAIL,
    phone: "",
    role: "associate",
    firm_id: owner?.id || null,
    is_active: true,
  });

  if (profErr) {
    console.error("Profile error:", profErr.message);
  } else {
    console.log("Profile created with role=associate, linked to owner's firm.");
  }

  console.log("\n========================================");
  console.log("EMPLOYEE TEST USER FIXED");
  console.log("========================================");
  console.log(`Email:    ${EMAIL}`);
  console.log(`Password: ${PASSWORD}`);
  console.log(`User ID:  ${authData.user.id}`);
  console.log("========================================");
}

fixEmployee().catch(console.error);
