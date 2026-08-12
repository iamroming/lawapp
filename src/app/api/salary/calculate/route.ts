import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("firm_id, role")
      .eq("id", user.uuid)
      .single();

    if (!profile?.firm_id) return NextResponse.json({ error: "No firm" }, { status: 400 });
    if (!["owner", "partner", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const { employee_id, month, year } = body;

    if (!employee_id || !month || !year) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get employee details
    const { data: employee } = await supabase
      .from("profiles")
      .select("payment_type, monthly_salary, percentage_rate, pf_enabled, esi_enabled, tds_rate")
      .eq("id", employee_id)
      .single();

    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    const periodStart = new Date(year, month - 1, 1).toISOString().split("T")[0];
    const periodEnd = new Date(year, month, 0).toISOString().split("T")[0];

    let base_salary = 0;
    let percentage_earned = 0;
    let earnings_breakdown: any[] = [];

    if (employee.payment_type === "fixed_salary") {
      base_salary = employee.monthly_salary || 0;
    } else if (employee.payment_type === "case_percentage") {
      // Get case earnings for the period
      const { data: caseEarnings } = await supabase
        .from("case_earnings")
        .select(`
          *,
          case:cases(id, case_number, title)
        `)
        .eq("employee_id", employee_id)
        .eq("settled", false)
        .gte("created_at", periodStart)
        .lt("created_at", periodEnd + "T23:59:59");

      earnings_breakdown = (caseEarnings || []).map((ce: any) => ({
        case_id: ce.case_id,
        case_number: ce.case?.case_number,
        case_title: ce.case?.title,
        collected_amount: ce.collected_amount,
        percentage_rate: ce.percentage_rate,
        earned_amount: ce.earned_amount,
      }));

      percentage_earned = earnings_breakdown.reduce((sum, e) => sum + (e.earned_amount || 0), 0);
    }

    const total_earnings = base_salary + percentage_earned;

    // Calculate deductions - PF on basic+DA up to ₹15,000 ceiling
    let pf_deduction = 0;
    let esi_deduction = 0;
    let tds_deduction = 0;

    const pfWage = Math.min(base_salary || total_earnings, 15000);
    if (employee.pf_enabled) pf_deduction = Math.round(pfWage * 0.12 * 100) / 100;
    // ESI only if gross <= ₹21,000
    if (employee.esi_enabled && total_earnings <= 21000) esi_deduction = Math.round(total_earnings * 0.0075 * 100) / 100;
    if (employee.tds_rate) tds_deduction = Math.round(total_earnings * (employee.tds_rate / 100) * 100) / 100;

    const total_deductions = Math.round((pf_deduction + esi_deduction + tds_deduction) * 100) / 100;
    const net_payable = Math.round((total_earnings - total_deductions) * 100) / 100;

    return NextResponse.json({
      employee_id,
      period: { month, year, start: periodStart, end: periodEnd },
      payment_type: employee.payment_type,
      base_salary,
      percentage_earned,
      earnings_breakdown,
      total_earnings,
      deductions: {
        pf: pf_deduction,
        esi: esi_deduction,
        tds: tds_deduction,
        total: total_deductions,
      },
      net_payable,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
