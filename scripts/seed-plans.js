const SUPABASE_URL = "https://dsqlpoepaprirwlyfoaj.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcWxwb2VwYXByaXJ3bHlmb2FqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTA2NzI4MiwiZXhwIjoyMTAwNjQzMjgyfQ.ZMHrqCj6s3mBi6p9u4sglo0Q38iOFVZj2h9W4tTxdKQ";

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

const plans = [
  {
    name: "Free",
    slug: "free",
    description: "Try CaseFiles with basic features. Perfect for solo lawyers getting started.",
    price: 0,
    billing_period: "monthly",
    max_cases: 3,
    max_users: 1,
    max_storage_mb: 100,
    is_active: true,
    features: JSON.stringify(["3 active cases", "1 user", "100 MB storage", "Basic dashboard", "Mobile access"]),
  },
  {
    name: "Solo",
    slug: "solo",
    description: "For individual lawyers handling a growing caseload.",
    price: 299,
    billing_period: "monthly",
    max_cases: 20,
    max_users: 1,
    max_storage_mb: 1024,
    is_active: true,
    features: JSON.stringify(["20 active cases", "1 user", "1 GB storage", "E-filing integration", "Court tracking", "Invoice generation", "Notifications"]),
  },
  {
    name: "Professional",
    slug: "professional",
    description: "For established lawyers and small teams managing diverse cases.",
    price: 799,
    billing_period: "monthly",
    max_cases: -1,
    max_users: 3,
    max_storage_mb: 5120,
    is_active: true,
    features: JSON.stringify(["Unlimited active cases", "3 users", "5 GB storage", "Everything in Solo", "Team collaboration", "Client portal", "AI-powered research", "Priority support"]),
  },
  {
    name: "Firm",
    slug: "firm",
    description: "For law firms that need full team access and unlimited storage.",
    price: 1999,
    billing_period: "monthly",
    max_cases: -1,
    max_users: 10,
    max_storage_mb: 20480,
    is_active: true,
    features: JSON.stringify(["Unlimited active cases", "10 users", "20 GB storage", "Everything in Professional", "Admin controls", "Bulk operations", "Custom reports", "API access"]),
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    description: "For large firms and organizations with custom requirements.",
    price: 4999,
    billing_period: "monthly",
    max_cases: -1,
    max_users: -1,
    max_storage_mb: -1,
    is_active: true,
    features: JSON.stringify(["Unlimited everything", "Unlimited users", "Unlimited storage", "Everything in Firm", "Dedicated support", "Custom integrations", "SLA guarantee", "Onboarding assistance"]),
  },
];

async function run() {
  // 1. Fetch existing plans
  console.log("Fetching existing plans...");
  const listRes = await fetch(`${SUPABASE_URL}/rest/v1/subscription_plans?select=id,slug,name`, { headers });
  const existing = await listRes.json();
  console.log(`Found ${existing.length} existing plans:`, existing.map((p) => p.slug).join(", "));

  const existingMap = {};
  for (const p of existing) existingMap[p.slug] = p.id;

  // 2. Upsert each plan
  for (const plan of plans) {
    const id = existingMap[plan.slug];
    if (id) {
      // Update
      console.log(`Updating "${plan.slug}" (id: ${id})...`);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/subscription_plans?slug=eq.${plan.slug}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(plan),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error(`  FAILED: ${err}`);
      } else {
        console.log(`  OK - ₹${plan.price}/mo, ${plan.max_users} users, ${plan.max_cases === -1 ? "unlimited" : plan.max_cases} cases`);
      }
    } else {
      // Insert
      console.log(`Inserting "${plan.slug}"...`);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/subscription_plans`, {
        method: "POST",
        headers,
        body: JSON.stringify(plan),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error(`  FAILED: ${err}`);
      } else {
        console.log(`  OK - ₹${plan.price}/mo, ${plan.max_users} users, ${plan.max_cases === -1 ? "unlimited" : plan.max_cases} cases`);
      }
    }
  }

  // 3. Verify
  console.log("\nVerifying final state...");
  const verifyRes = await fetch(`${SUPABASE_URL}/rest/v1/subscription_plans?select=name,slug,price,max_cases,max_users,max_storage_mb,is_active&order=price`, { headers });
  const final = await verifyRes.json();
  console.table(final);
}

run().catch(console.error);
