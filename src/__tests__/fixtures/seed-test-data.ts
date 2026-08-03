/**
 * Test Data Pool Generator
 * 
 * Generates realistic dummy data for testing LawXP.
 * Run: npx tsx src/__tests__/fixtures/seed-test-data.ts
 * 
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Deterministic seed data ---

export const TEST_USERS = {
  owner: {
    email: "owner.test@lawxp.com",
    password: "TestOwner@123",
    full_name: "Advocate Priya Sharma",
    phone: "9876543210",
    firm_name: "Sharma & Associates",
  },
  employee: {
    email: "employee.test@lawxp.com",
    password: "TestEmployee@123",
    full_name: "Advocate Rahul Verma",
    phone: "9876543211",
  },
  client1: {
    full_name: "Rajesh Kumar Gupta",
    email: "rajesh.gupta@email.com",
    phone: "9812345678",
    company_name: "Gupta Industries Pvt Ltd",
    gst_number: "27AAPFU0939F1ZV",
    address: "123 MG Road, Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    id_type: "pan" as const,
    id_number: "AAPFU0939F",
  },
  client2: {
    full_name: "Sunita Devi",
    email: "sunita.devi@email.com",
    phone: "9823456789",
    address: "45 Nehru Nagar, Delhi",
    city: "Delhi",
    state: "Delhi",
    pincode: "110001",
    id_type: "aadhaar" as const,
    id_number: "1234-5678-9012",
  },
  client3: {
    full_name: "Tech Solutions Corp",
    email: "legal@techsolutions.com",
    phone: "9834567890",
    company_name: "Tech Solutions Corporation Ltd",
    gst_number: "29BQAPS1234F1Z5",
    address: "789 Brigade Road, Bangalore",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560001",
  },
};

export const TEST_CASES = [
  {
    title: "Gupta Industries vs National Textiles Ltd",
    description: "Breach of contract for supply of raw materials. The defendant failed to deliver 500 tons of cotton as per agreement dated 15-Jan-2026.",
    case_type: "civil",
    court: "Bombay High Court",
    priority: "high" as const,
    opposing_party: "National Textiles Ltd",
    opposing_counsel: "Advocate Mehta",
    total_fee: 150000,
  },
  {
    title: "Sunita Devi vs State of Delhi",
    description: "Wrongful termination from employment. Petitioner was terminated without notice or valid reason after 8 years of service.",
    case_type: "labor",
    court: "Delhi District Court",
    priority: "medium" as const,
    opposing_party: "State of Delhi",
    opposing_counsel: "Government Pleader",
    total_fee: 75000,
  },
  {
    title: "Tech Solutions vs DataFlow Inc",
    description: "Intellectual property dispute over software algorithm. Plaintiff claims ownership of proprietary code developed during joint venture.",
    case_type: "intellectual_property",
    court: "Bangalore City Civil Court",
    priority: "urgent" as const,
    opposing_party: "DataFlow Inc",
    opposing_counsel: "Advocate Krishnamurthy",
    total_fee: 250000,
  },
  {
    title: "Criminal Revision - Amit Singh",
    description: "Revision petition against order dated 10-Mar-2026 in Sessions Case No. 45/2026. Accused convicted under IPC Section 302.",
    case_type: "criminal",
    court: "Sessions Court, Mumbai",
    priority: "high" as const,
    opposing_party: "State of Maharashtra",
    opposing_counsel: "Public Prosecutor",
    total_fee: 200000,
  },
  {
    title: "Sharma Family Trust Dispute",
    description: "Dispute between trustees over distribution of trust assets. Three siblings contesting the will of late Shri H.R. Sharma.",
    case_type: "family",
    court: "Family Court, Pune",
    priority: "medium" as const,
    opposing_party: "Vikram Sharma & Anil Sharma",
    opposing_counsel: "Advocate Deshpande",
    total_fee: 120000,
  },
  {
    title: "Property Possession - Flat 4B",
    description: "Suit for recovery of possession of flat. Builder failed to deliver possession within stipulated time under RERA.",
    case_type: "property",
    court: "RERA Tribunal, Maharashtra",
    priority: "low" as const,
    opposing_party: "ABC Builders Pvt Ltd",
    opposing_counsel: "Advocate Joshi",
    total_fee: 80000,
  },
  {
    title: "Consumer Complaint - Defective Product",
    description: "Complaint under Consumer Protection Act for defective electronic goods. Product malfunctioned within 3 months of purchase.",
    case_type: "consumer",
    court: "Consumer Disputes Commission",
    priority: "low" as const,
    opposing_party: "ElectroMart Ltd",
    opposing_counsel: "N/A",
    total_fee: 25000,
  },
  {
    title: "Writ Petition - Right to Information",
    description: "Writ petition under Article 226 for non-response to RTI application regarding government contracts.",
    case_type: "constitutional",
    court: "High Court of Judicature at Madras",
    priority: "medium" as const,
    opposing_party: "Union of India",
    opposing_counsel: "Central Government Standing Counsel",
    total_fee: 50000,
  },
];

export const TEST_HEARINGS = [
  { daysFromNow: 3, court: "Court Room 12, Bombay HC", judge: "Justice Patel", purpose: "Final arguments" },
  { daysFromNow: 7, court: "Court Room 5, Delhi DC", judge: "Mr. Justice Kumar", purpose: "Cross-examination" },
  { daysFromNow: 14, court: "Court Room 3, Bangalore CC", judge: "Justice Gowda", purpose: "Interim application" },
  { daysFromNow: 21, court: "Court Room 8, Sessions Court", judge: "Mr. Judge Sharma", purpose: "Evidence recording" },
];

export const TEST_INVOICES = [
  { amount: 50000, description: "Legal consultation - January 2026", gst_rate: 18, status: "paid" },
  { amount: 75000, description: "Case filing fees and representation", gst_rate: 18, status: "pending" },
  { amount: 25000, description: "Document drafting and review", gst_rate: 18, status: "overdue" },
  { amount: 100000, description: "Retainer fee - Q1 2026", gst_rate: 18, status: "paid" },
  { amount: 35000, description: "Court appearance fees", gst_rate: 18, status: "pending" },
  { amount: 15000, description: "Research and case analysis", gst_rate: 18, status: "draft" },
];

export const TEST_PAYMENTS = [
  { amount: 50000, method: "bank_transfer" as const, reference: "NEFT/2026/001" },
  { amount: 100000, method: "upi" as const, reference: "UPI/TXN/002" },
  { amount: 25000, method: "cheque" as const, reference: "CHQ-001234" },
];

export const TEST_TIME_ENTRIES = [
  { description: "Initial client consultation", hours: 2, rate: 5000, billable: true },
  { description: "Case research - precedents", hours: 4, rate: 3000, billable: true },
  { description: "Drafting petition", hours: 6, rate: 4000, billable: true },
  { description: "Court appearance", hours: 3, rate: 5000, billable: true },
  { description: "Internal team meeting", hours: 1, rate: 0, billable: false },
];

// --- Seed functions ---

async function seedClients(firmId: string) {
  console.log("Seeding clients...");
  const clients = [TEST_USERS.client1, TEST_USERS.client2, TEST_USERS.client3];
  const results = [];

  for (const client of clients) {
    const { data, error } = await supabase
      .from("clients")
      .upsert({
        ...client,
        firm_id: firmId,
        created_by: firmId,
      }, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.error(`  Error creating client ${client.full_name}:`, error.message);
    } else {
      console.log(`  Created client: ${client.full_name} (${data.id})`);
      results.push(data);
    }
  }
  return results;
}

async function seedCases(firmId: string, clientIds: string[]) {
  console.log("Seeding cases...");
  const results = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const caseData = TEST_CASES[i];
    const clientId = clientIds[i % clientIds.length];

    const { data, error } = await supabase
      .from("cases")
      .upsert({
        ...caseData,
        client_id: clientId,
        firm_id: firmId,
        created_by: firmId,
        status: i < 3 ? "active" : i < 5 ? "pending" : "closed",
      }, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.error(`  Error creating case:`, error.message);
    } else {
      console.log(`  Created case: ${caseData.title.substring(0, 50)}... (${data.id})`);
      results.push(data);
    }
  }
  return results;
}

async function seedHearings(caseIds: string[]) {
  console.log("Seeding hearings...");
  const results = [];

  for (let i = 0; i < Math.min(TEST_HEARINGS.length, caseIds.length); i++) {
    const hearing = TEST_HEARINGS[i];
    const caseId = caseIds[i];
    const hearingDate = new Date();
    hearingDate.setDate(hearingDate.getDate() + hearing.daysFromNow);

    const { data, error } = await supabase
      .from("hearings")
      .insert({
        case_id: caseId,
        hearing_date: hearingDate.toISOString().split("T")[0],
        court: hearing.court,
        judge_name: hearing.judge,
        purpose: hearing.purpose,
        is_completed: false,
      })
      .select()
      .single();

    if (error) {
      console.error(`  Error creating hearing:`, error.message);
    } else {
      console.log(`  Created hearing: ${hearing.purpose} on ${hearingDate.toISOString().split("T")[0]} (${data.id})`);
      results.push(data);
    }
  }
  return results;
}

async function seedTimeEntries(userId: string, caseIds: string[]) {
  console.log("Seeding time entries...");

  for (let i = 0; i < TEST_TIME_ENTRIES.length; i++) {
    const entry = TEST_TIME_ENTRIES[i];
    const caseId = caseIds[i % caseIds.length];

    const { error } = await supabase
      .from("time_entries")
      .insert({
        user_id: userId,
        case_id: caseId,
        description: entry.description,
        hours: entry.hours,
        rate_per_hour: entry.rate,
        is_billable: entry.billable,
        date: new Date().toISOString().split("T")[0],
      });

    if (error) {
      console.error(`  Error creating time entry:`, error.message);
    } else {
      console.log(`  Created time entry: ${entry.description} (${entry.hours}h)`);
    }
  }
}

async function cleanupTestData() {
  console.log("\nCleaning up existing test data...");
  const testEmails = Object.values(TEST_USERS).map((u) => u.email);

  // Delete in reverse FK order
  await supabase.from("time_entries").delete().in("user_id",
    (await supabase.from("profiles").select("id").in("email", testEmails)).data?.map((p: any) => p.id) || []
  );
  await supabase.from("hearings").delete().in("case_id",
    (await supabase.from("cases").select("id").like("title", "%Gupta%")).data?.map((c: any) => c.id) || []
  );
  await supabase.from("cases").delete().like("title", "%Gupta%");
  await supabase.from("clients").delete().in("email", testEmails);

  console.log("Cleanup complete.");
}

// --- Main ---

async function main() {
  const action = process.argv[2] || "seed";

  if (action === "cleanup") {
    await cleanupTestData();
    return;
  }

  console.log("=== LawXP Test Data Pool ===\n");

  // Get or create owner
  console.log("Setting up owner user...");
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: TEST_USERS.owner.email,
    password: TEST_USERS.owner.password,
    email_confirm: true,
    user_metadata: {
      full_name: TEST_USERS.owner.full_name,
      phone: TEST_USERS.owner.phone,
      firm_name: TEST_USERS.owner.firm_name,
    },
  });

  let ownerId: string;

  if (authError) {
    if (authError.message.includes("already exists")) {
      const { data: users } = await supabase.auth.admin.listUsers();
      const existing = users?.users?.find((u) => u.email === TEST_USERS.owner.email);
      if (!existing) {
        console.error("User exists but cannot find ID");
        return;
      }
      ownerId = existing.id;
      console.log(`  Owner already exists: ${ownerId}`);
    } else {
      console.error("Auth error:", authError.message);
      return;
    }
  } else {
    ownerId = authData.user!.id;
    console.log(`  Created owner: ${ownerId}`);
  }

  // Create profile
  await supabase.from("profiles").upsert({
    id: ownerId,
    full_name: TEST_USERS.owner.full_name,
    email: TEST_USERS.owner.email,
    phone: TEST_USERS.owner.phone,
    firm_name: TEST_USERS.owner.firm_name,
    role: "owner",
    firm_id: ownerId,
    is_active: true,
  }, { onConflict: "id" });

  // Seed data
  const clients = await seedClients(ownerId);
  const clientIds = clients.map((c) => c.id);
  const cases = await seedCases(ownerId, clientIds);
  const caseIds = cases.map((c) => c.id);
  await seedHearings(caseIds);
  await seedTimeEntries(ownerId, caseIds);

  console.log("\n=== Test Data Pool Complete ===");
  console.log(`Owner: ${TEST_USERS.owner.email} / ${TEST_USERS.owner.password}`);
  console.log(`Clients: ${clients.length}`);
  console.log(`Cases: ${cases.length}`);
  console.log(`Hearings: ${Math.min(TEST_HEARINGS.length, caseIds.length)}`);
  console.log(`Time entries: ${TEST_TIME_ENTRIES.length}`);
}

main().catch(console.error);
