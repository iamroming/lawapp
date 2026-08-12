import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { generateCalendarPDF } from "@/lib/calendar-export";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const month = req.nextUrl.searchParams.get("month");
  const year = req.nextUrl.searchParams.get("year");
  const type = req.nextUrl.searchParams.get("type") || "all";

  const { data: profile } = await supabase
    .from("profiles").select("role, firm_id").eq("id", user.uuid).single();

  const isOwner = profile?.role === "owner" || profile?.role === "partner" || profile?.role === "super_admin";
  const firmId = profile?.firm_id || user.uuid;

  const events: any[] = [];

  // Fetch hearings
  if (type === "all" || type === "hearing") {
    let q = supabase
      .from("hearings")
      .select("*, case:cases(id, case_number, title)")
      .order("hearing_date");
    q = isOwner ? q.eq("firm_id", firmId) : q.eq("created_by", user.uuid);
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59).toISOString();
      q = q.gte("hearing_date", startDate).lte("hearing_date", endDate);
    }
    const { data } = await q;
    for (const h of data || []) {
      events.push({
        id: h.id,
        title: h.case?.title || h.purpose || "Hearing",
        date: h.hearing_date,
        time: new Date(h.hearing_date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        type: "hearing",
        description: h.purpose,
        court: h.court,
        judge_name: h.judge_name,
        case_number: h.case?.case_number,
        is_completed: h.is_completed,
      });
    }
  }

  // Fetch rules
  if (type === "all" || type === "rule") {
    let q = supabase.from("calendar_rules").select("*").order("rule_date");
    q = isOwner ? q.eq("firm_id", firmId) : q.eq("created_by", user.uuid);
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59).toISOString();
      q = q.gte("rule_date", startDate).lte("rule_date", endDate);
    }
    const { data } = await q;
    for (const r of data || []) {
      events.push({
        id: r.id,
        title: r.title,
        date: r.rule_date,
        type: "rule",
        description: r.description,
        court: r.court,
      });
    }
  }

  // Fetch events
  if (type === "all" || type === "event") {
    let q = supabase.from("calendar_events").select("*").order("event_date");
    q = isOwner ? q.eq("firm_id", firmId) : q.eq("created_by", user.uuid);
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59).toISOString();
      q = q.gte("event_date", startDate).lte("event_date", endDate);
    }
    const { data } = await q;
    for (const e of data || []) {
      events.push({
        id: e.id,
        title: e.title,
        date: e.event_date,
        type: "event",
        description: e.description,
      });
    }
  }

  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthYear = month && year
    ? `${monthNames[parseInt(month) - 1]} ${year}`
    : `All Events (${events.length})`;

  const pdfBlob = generateCalendarPDF(events, monthYear);
  const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="casefiles-calendar-${month || "all"}-${year || "all"}.pdf"`,
    },
  });
}
