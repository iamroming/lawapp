import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { generateCasesPDF } from "@/lib/pdf-export";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("firm_id, firm_name").eq("id", user.uuid).single();
  const firmId = profile?.firm_id || user.uuid;

  const { data: cases } = await supabase
    .from("cases")
    .select("case_number, title, status, court, client:clients(full_name)")
    .eq("firm_id", firmId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const blob = generateCasesPDF(cases || [], profile?.firm_name || "CaseFiles");

  return new Response(blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cases-report-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
