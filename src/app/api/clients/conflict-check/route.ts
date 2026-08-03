import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { full_name, email, phone, company_name } = body;

  // Get user's firm_id for firm-wide conflict checks
  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.id)
    .single();

  const firmId = profile?.firm_id;
  const conflicts: { type: string; entity: string; id: string; reason: string }[] = [];

  if (full_name) {
    const { data: nameMatches } = await supabase
      .from("clients")
      .select("id, full_name, company_name")
      .ilike("full_name", `%${full_name}%`)
      .eq("firm_id", firmId)
      .is("deleted_at", null)
      .limit(5);

    if (nameMatches) {
      for (const match of nameMatches) {
        conflicts.push({
          type: "name_match",
          entity: match.full_name,
          id: match.id,
          reason: `Similar name found: "${match.full_name}"${match.company_name ? ` (${match.company_name})` : ""}`,
        });
      }
    }
  }

  if (email) {
    const { data: emailMatches } = await supabase
      .from("clients")
      .select("id, full_name, email")
      .eq("email", email)
      .eq("firm_id", firmId)
      .is("deleted_at", null)
      .limit(5);

    if (emailMatches) {
      for (const match of emailMatches) {
        conflicts.push({
          type: "email_match",
          entity: match.full_name,
          id: match.id,
          reason: `Email already exists for: "${match.full_name}"`,
        });
      }
    }
  }

  if (phone) {
    const { data: phoneMatches } = await supabase
      .from("clients")
      .select("id, full_name, phone")
      .eq("phone", phone)
      .eq("firm_id", firmId)
      .is("deleted_at", null)
      .limit(5);

    if (phoneMatches) {
      for (const match of phoneMatches) {
        conflicts.push({
          type: "phone_match",
          entity: match.full_name,
          id: match.id,
          reason: `Phone number already exists for: "${match.full_name}"`,
        });
      }
    }
  }

  if (company_name) {
    const { data: companyMatches } = await supabase
      .from("clients")
      .select("id, full_name, company_name")
      .ilike("company_name", `%${company_name}%`)
      .eq("firm_id", firmId)
      .is("deleted_at", null)
      .limit(5);

    if (companyMatches) {
      for (const match of companyMatches) {
        if (!conflicts.find((c) => c.id === match.id)) {
          conflicts.push({
            type: "company_match",
            entity: match.full_name,
            id: match.id,
            reason: `Similar company found: "${match.company_name}" (Client: ${match.full_name})`,
          });
        }
      }
    }
  }

  return NextResponse.json({
    hasConflicts: conflicts.length > 0,
    conflicts,
    checkedAt: new Date().toISOString(),
  });
}
