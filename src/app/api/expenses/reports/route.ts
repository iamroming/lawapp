import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

// GET — expense reports/summary
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const groupBy = searchParams.get("group_by") || "category"; // category | case | client | month

    // Get user's firm_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("firm_id, role")
      .eq("id", user.uuid)
      .single();

    let query = supabase.from("expenses").select("*, cases(id, title, case_number), clients(id, full_name)");
    if (profile?.firm_id && ["owner", "partner"].includes(profile.role || "")) {
      query = query.eq("firm_id", profile.firm_id);
    } else {
      query = query.eq("user_id", user.uuid);
    }

    if (startDate) query = query.gte("expense_date", startDate);
    if (endDate) query = query.lte("expense_date", endDate);
    if (searchParams.get("category")) query = query.eq("category", searchParams.get("category"));
    if (searchParams.get("billable")) query = query.eq("is_billable", searchParams.get("billable") === "true");

    const { data: expenses, error } = await query;
    if (error) throw error;

    // Group and summarize
    const grouped: Record<string, { count: number; total: number; billable: number; unbilled: number }> = {};
    let grandTotal = 0;
    let grandBillable = 0;
    let grandUnbilled = 0;

    for (const exp of expenses || []) {
      let key: string;
      if (groupBy === "case") key = (exp as any).cases?.case_number || "Unlinked";
      else if (groupBy === "client") key = (exp as any).clients?.full_name || "Unlinked";
      else if (groupBy === "month") key = (exp as any).expense_date?.substring(0, 7) || "Unknown";
      else key = (exp as any).category || "other";

      if (!grouped[key]) grouped[key] = { count: 0, total: 0, billable: 0, unbilled: 0 };
      grouped[key].count += 1;
      grouped[key].total += (exp as any).amount || 0;
      grandTotal += (exp as any).amount || 0;
      if ((exp as any).is_billable) {
        grouped[key].billable += (exp as any).amount || 0;
        grandBillable += (exp as any).amount || 0;
      }
      if (!(exp as any).is_billed) {
        grouped[key].unbilled += (exp as any).amount || 0;
        grandUnbilled += (exp as any).amount || 0;
      }
    }

    return NextResponse.json({
      summary: {
        total: grandTotal,
        billable: grandBillable,
        unbilled: grandUnbilled,
        count: expenses?.length || 0,
      },
      breakdown: grouped,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}
