import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const { data: profile } = await supabase
      .from("profiles")
      .select("firm_id")
      .eq("id", user.uuid)
      .single();

    const firmId = profile?.firm_id || user.uuid;

    const { data: branch, error } = await supabase
      .from("branches")
      .select("*")
      .eq("id", id)
      .eq("firm_id", firmId)
      .single();

    if (error || !branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    // Get employees in this branch
    const { data: employeeBranches } = await supabase
      .from("employee_branches")
      .select("*, employee:profiles(id, full_name, email, role, avatar_url)")
      .eq("branch_id", id);

    const employees = (employeeBranches || []).map((eb: any) => ({
      ...eb.employee,
      employee_branch_id: eb.id,
      is_primary: eb.is_primary,
    }));

    // Get counts
    const [casesCount, clientsCount, invoicesCount] = await Promise.all([
      supabase.from("cases").select("id", { count: "exact", head: true }).eq("branch_id", id).is("deleted_at", null),
      supabase.from("clients").select("id", { count: "exact", head: true }).eq("branch_id", id),
      supabase.from("invoices").select("id", { count: "exact", head: true }).eq("branch_id", id),
    ]);

    return NextResponse.json({
      ...branch,
      employees,
      counts: {
        cases: casesCount.count || 0,
        clients: clientsCount.count || 0,
        invoices: invoicesCount.count || 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const { data: profile } = await supabase
      .from("profiles")
      .select("firm_id, role")
      .eq("id", user.uuid)
      .single();

    if (!["owner", "partner"].includes(profile?.role || "")) {
      return NextResponse.json({ error: "Only owners and partners can edit branches" }, { status: 403 });
    }

    const firmId = profile?.firm_id || user.uuid;
    const body = await request.json();
    const { name, address, city, state, pincode, phone, email, operating_hours } = body;

    const { data: branch, error } = await supabase
      .from("branches")
      .update({
        name: name?.trim(),
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        pincode: pincode?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        operating_hours: operating_hours || {},
      })
      .eq("id", id)
      .eq("firm_id", firmId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(branch);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const { data: profile } = await supabase
      .from("profiles")
      .select("firm_id, role")
      .eq("id", user.uuid)
      .single();

    if (!["owner", "partner"].includes(profile?.role || "")) {
      return NextResponse.json({ error: "Only owners and partners can delete branches" }, { status: 403 });
    }

    const firmId = profile?.firm_id || user.uuid;

    // Soft delete - set is_active to false
    const { error } = await supabase
      .from("branches")
      .update({ is_active: false })
      .eq("id", id)
      .eq("firm_id", firmId);

    if (error) throw error;

    // Remove all employee assignments from this branch
    await supabase.from("employee_branches").delete().eq("branch_id", id);

    // Clear branch_id from cases, clients, invoices in this branch
    await Promise.all([
      supabase.from("cases").update({ branch_id: null }).eq("branch_id", id),
      supabase.from("clients").update({ branch_id: null }).eq("branch_id", id),
      supabase.from("invoices").update({ branch_id: null }).eq("branch_id", id),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
