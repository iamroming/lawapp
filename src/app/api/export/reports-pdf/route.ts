import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { generateReportsPDF } from "@/lib/pdf-export";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("firm_id, firm_name").eq("id", user.uuid).single();
  const firmId = profile?.firm_id || user.uuid;

  // Fetch stats
  const [casesResult, clientsResult, hearingsResult] = await Promise.all([
    supabase.from("cases").select("id, title, status, total_fee, amount_received").eq("firm_id", firmId).is("deleted_at", null),
    supabase.from("clients").select("id").eq("firm_id", firmId).is("deleted_at", null),
    supabase.from("hearings").select("id, hearing_date").eq("firm_id", firmId).is("deleted_at", null),
  ]);

  const cases = casesResult.data || [];
  const totalBilled = cases.reduce((s, c) => s + (c.total_fee || 0), 0);
  const totalReceived = cases.reduce((s, c) => s + (c.amount_received || 0), 0);
  const activeCases = cases.filter((c) => c.status !== "closed" && c.status !== "disposed").length;
  const closedCases = cases.filter((c) => c.status === "closed" || c.status === "disposed").length;
  const upcomingHearings = (hearingsResult.data || []).filter((h) => new Date(h.hearing_date) >= new Date()).length;

  const reportData = {
    title: "Firm Overview Report",
    summary: [
      { label: "Total Cases", value: cases.length },
      { label: "Active Cases", value: activeCases },
      { label: "Total Clients", value: (clientsResult.data || []).length },
      { label: "Total Billed", value: `₹${totalBilled.toLocaleString("en-IN")}` },
      { label: "Total Received", value: `₹${totalReceived.toLocaleString("en-IN")}` },
      { label: "Upcoming Hearings", value: upcomingHearings },
    ],
    headers: ["Case No.", "Title", "Status", "Billed", "Received"],
    rows: cases.slice(0, 50).map((c) => ({
      cells: [
        c.id?.substring(0, 8) || "",
        c.title || "",
        c.status || "",
        `₹${(c.total_fee || 0).toLocaleString("en-IN")}`,
        `₹${(c.amount_received || 0).toLocaleString("en-IN")}`,
      ],
    })),
  };

  const blob = generateReportsPDF(reportData, profile?.firm_name || "CaseFiles");

  return new Response(blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="firm-report-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
