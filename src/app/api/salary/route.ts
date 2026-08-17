import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

export async function GET(request: NextRequest) {
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

    // Role check: only owner/partner/office_admin can view salary data
    const salaryViewRoles = ["owner", "partner", "office_admin", "super_admin"];
    if (!profile?.role || !salaryViewRoles.includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get("employee_id");
    const status = searchParams.get("status");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    let query = supabase
      .from("salary_payments")
      .select(`
        *,
        employee:profiles!salary_payments_employee_id_fkey(id, full_name, email, payment_type, monthly_salary, percentage_rate)
      `)
      .eq("firm_id", profile.firm_id)
      .order("created_at", { ascending: false });

    if (employeeId) query = query.eq("employee_id", employeeId);
    if (status) query = query.eq("status", status);
    if (month && year) {
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split("T")[0];
      query = query.gte("period_start", startDate).lte("period_end", endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
    if (!["owner", "partner", "office_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const { employee_id, period_start, period_end, notes, payment_method } = body;

    // Validate required fields
    if (!employee_id || typeof employee_id !== "string") {
      return NextResponse.json({ error: "Valid employee_id is required" }, { status: 400 });
    }
    if (!period_start || !/^\d{4}-\d{2}-\d{2}$/.test(period_start)) {
      return NextResponse.json({ error: "period_start must be YYYY-MM-DD format" }, { status: 400 });
    }
    if (!period_end || !/^\d{4}-\d{2}-\d{2}$/.test(period_end)) {
      return NextResponse.json({ error: "period_end must be YYYY-MM-DD format" }, { status: 400 });
    }
    if (new Date(period_end) < new Date(period_start)) {
      return NextResponse.json({ error: "period_end must be after period_start" }, { status: 400 });
    }

    // Get employee details
    const { data: employee } = await supabase
      .from("profiles")
      .select("payment_type, monthly_salary, percentage_rate, pf_enabled, esi_enabled, tds_rate")
      .eq("id", employee_id)
      .single();

    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    let base_salary = 0;
    let percentage_earned = 0;

    if (employee.payment_type === "fixed_salary") {
      base_salary = employee.monthly_salary || 0;
    } else if (employee.payment_type === "case_percentage") {
      // Calculate percentage earnings from case_earnings
      const { data: earnings } = await supabase
        .from("case_earnings")
        .select("earned_amount")
        .eq("employee_id", employee_id)
        .eq("settled", false)
        .gte("created_at", period_start)
        .lt("created_at", period_end + "T23:59:59");

      percentage_earned = (earnings || []).reduce((sum, e) => sum + (e.earned_amount || 0), 0);
    }

    const total_earnings = base_salary + percentage_earned;

    // Calculate deductions - PF on basic+DA up to ₹15,000 ceiling
    let pf_deduction = 0;
    let esi_deduction = 0;
    let tds_deduction = 0;

    const pfWage = Math.min(base_salary || total_earnings, 15000);
    if (employee.pf_enabled) {
      pf_deduction = Math.round(pfWage * 0.12 * 100) / 100;
    }
    // ESI only if gross <= ₹21,000
    if (employee.esi_enabled && total_earnings <= 21000) {
      esi_deduction = Math.round(total_earnings * 0.0075 * 100) / 100;
    }
    if (employee.tds_rate) {
      tds_deduction = Math.round(total_earnings * (employee.tds_rate / 100) * 100) / 100;
    }

    const total_deductions = Math.round((pf_deduction + esi_deduction + tds_deduction) * 100) / 100;
    const net_payable = Math.round((total_earnings - total_deductions) * 100) / 100;

    // Create salary payment record
    const { data: salaryPayment, error } = await supabase
      .from("salary_payments")
      .insert({
        employee_id,
        firm_id: profile.firm_id,
        period_start,
        period_end,
        payment_type: employee.payment_type,
        base_salary,
        percentage_earned,
        total_earnings,
        pf_deduction,
        esi_deduction,
        tds_deduction,
        total_deductions,
        net_payable,
        status: "pending",
        notes,
        payment_method: payment_method || "bank_transfer",
        created_by: user.uuid,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(salaryPayment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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
    if (!["owner", "partner", "office_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, payment_method, transaction_ref, notes } = body;

    if (!id) return NextResponse.json({ error: "Missing payment ID" }, { status: 400 });

    const updateData: any = {};
    if (status) {
      const validStatuses = ["pending", "processing", "paid", "cancelled"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
      }
      updateData.status = status;
      if (status === "paid") {
        updateData.paid_at = new Date().toISOString();
      }
    }
    if (payment_method) updateData.payment_method = payment_method;
    if (transaction_ref) updateData.transaction_ref = transaction_ref;
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await supabase
      .from("salary_payments")
      .update(updateData)
      .eq("id", id)
      .eq("firm_id", profile.firm_id)
      .select()
      .single();

    if (error) throw error;

    // If marked as paid, settle case_earnings
    if (status === "paid" && data.payment_type === "case_percentage") {
      await supabase
        .from("case_earnings")
        .update({ settled: true, settled_at: new Date().toISOString(), salary_payment_id: id })
        .eq("employee_id", data.employee_id)
        .eq("settled", false)
        .gte("created_at", data.period_start)
        .lt("created_at", data.period_end + "T23:59:59");
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
