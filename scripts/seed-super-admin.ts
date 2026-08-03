import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function seedSuperAdmin() {
  if (!SUPABASE_SERVICE_KEY) {
    console.error("Error: SUPABASE_SERVICE_ROLE_KEY is required.");
    console.error("Set it as an environment variable before running this script.");
    process.exit(1);
  }

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("Error: ADMIN_EMAIL and ADMIN_PASSWORD are required.");
    console.error("Run with: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=yourpassword npx tsx scripts/seed-super-admin.ts");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log("Creating super admin user...");

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes("already exists")) {
      console.log("User already exists, fetching ID...");
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users?.users?.find((u) => u.email === email);
      if (existingUser) {
        await insertSuperAdmin(supabase, existingUser.id, email);
      }
      return;
    }
    console.error("Auth error:", authError.message);
    return;
  }

  if (authData.user) {
    console.log("User created:", authData.user.id);
    await insertSuperAdmin(supabase, authData.user.id, email);
  }
}

async function insertSuperAdmin(supabase: any, userId: string, email: string) {
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    full_name: "Super Admin",
    email,
    phone: "",
    role: "admin",
    firm_name: "LawXP",
    is_active: true,
  });

  if (profileError) {
    console.error("Profile error:", profileError.message);
  } else {
    console.log("Profile created/updated");
  }

  const { error: saError } = await supabase.from("super_admins").upsert({
    id: userId,
    email,
    access_level: "owner",
    permissions: ["all"],
  });

  if (saError) {
    console.error("Super admin error:", saError.message);
  } else {
    console.log("Super admin access granted!");
  }

  console.log("\n========================================");
  console.log("SUPER ADMIN SETUP COMPLETE");
  console.log("========================================");
  console.log(`Email: ${email}`);
  console.log(`User ID: ${userId}`);
  console.log("");
  console.log("Login at: /login");
  console.log("Admin panel at: /super-admin");
  console.log("========================================");
}

seedSuperAdmin().catch(console.error);
