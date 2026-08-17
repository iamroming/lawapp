import { createClient } from "@supabase/supabase-js";
import { getAdminAuth } from "../src/lib/firebase/admin";
import { firebaseUidToUuid } from "../src/lib/firebase/uid";

const SUPER_ADMIN_EMAIL = "mubb@ymail.com";
const SUPER_ADMIN_PASSWORD = "123456";

async function loadEnv() {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // Env vars may already be set in the shell.
  }
}

async function main() {
  await loadEnv();

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
    console.error("Set them in .env.local before running this script.");
    process.exit(1);
  }

  const email = process.env.ADMIN_EMAIL || SUPER_ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD || SUPER_ADMIN_PASSWORD;

  // The app authenticates against Firebase Auth (client + server),
  // NOT Supabase Auth. The user MUST exist in Firebase to be able to log in.
  const auth = await getAdminAuth();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log("Creating super admin user in Firebase...");

  let firebaseUid: string;
  try {
    const existing = await auth.getUserByEmail(email);
    firebaseUid = existing.uid;
    console.log(`User already exists in Firebase (${firebaseUid}), resetting password...`);
    await auth.updateUser(existing.uid, { password });
  } catch (err: any) {
    if (err.code === "auth/user-not-found") {
      const record = await auth.createUser({
        email,
        password,
        displayName: "Super Admin",
        emailVerified: true,
      });
      firebaseUid = record.uid;
      console.log(`User created in Firebase: ${firebaseUid}`);
    } else {
      console.error("Firebase error:", err.message, err.code);
      process.exit(1);
    }
  }

  const profileUuid = firebaseUidToUuid(firebaseUid);

  // Remove any legacy rows created by the old Supabase-Auth based script so
  // email lookups (isSuperAdminByEmail) don't return duplicates.
  await supabase.from("super_admins").delete().eq("email", email);
  await supabase.from("profiles").delete().eq("email", email).neq("id", profileUuid);

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: profileUuid,
    full_name: "Super Admin",
    email,
    phone: "",
    role: "super_admin",
    firm_name: "CaseFiles",
    is_active: true,
  });

  if (profileError) {
    console.error("Profile error:", profileError.message);
    process.exit(1);
  }
  console.log("Profile created/updated");

  const { error: saError } = await supabase.from("super_admins").upsert({
    id: profileUuid,
    email,
    access_level: "owner",
    permissions: ["all"],
  });

  if (saError) {
    console.error("Super admin error:", saError.message);
    process.exit(1);
  }
  console.log("Super admin access granted!");

  console.log("\n========================================");
  console.log("SUPER ADMIN SETUP COMPLETE");
  console.log("========================================");
  console.log(`Email: ${email}`);
  console.log(`Firebase UID: ${firebaseUid}`);
  console.log(`Profile UUID: ${profileUuid}`);
  console.log("");
  console.log("Login at: /login");
  console.log("Admin panel at: /super-admin");
  console.log("========================================");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
