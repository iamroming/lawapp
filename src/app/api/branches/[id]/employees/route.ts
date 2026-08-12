import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

export async function POST(
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
      return NextResponse.json({ error: "Only owners and partners can assign employees" }, { status: 403 });
    }

    const firmId = profile?.firm_id || user.uuid;

    // Verify branch belongs to firm
    const { data: branch } = await supabase
      .from("branches")
      .select("id")
      .eq("id", id)
      .eq("firm_id", firmId)
      .single();

    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const body = await request.json();
    const { employee_id, is_primary } = body;

    if (!employee_id) {
      return NextResponse.json({ error: "employee_id is required" }, { status: 400 });
    }

    // Verify employee belongs to firm
    const { data: employee } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", employee_id)
      .eq("firm_id", firmId)
      .single();

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // If marking as primary, remove primary from other branches
    if (is_primary) {
      await supabase
        .from("employee_branches")
        .update({ is_primary: false })
        .eq("employee_id", employee_id);
    }

    const { data: eb, error } = await supabase
      .from("employee_branches")
      .upsert({
        employee_id,
        branch_id: id,
        is_primary: is_primary || false,
      }, { onConflict: "employee_id,branch_id" })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(eb, { status: 201 });
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
      return NextResponse.json({ error: "Only owners and partners can remove employees" }, { status: 403 });
    }

    const body = await request.json();
    const { employee_id } = body;

    if (!employee_id) {
      return NextResponse.json({ error: "employee_id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("employee_branches")
      .delete()
      .eq("branch_id", id)
      .eq("employee_id", employee_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
