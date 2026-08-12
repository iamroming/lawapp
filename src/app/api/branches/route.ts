import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { checkBranchLimit } from "@/lib/subscription-limits";

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

    const firmId = profile?.firm_id || user.uuid;

    const { data: branches, error } = await supabase
      .from("branches")
      .select("*")
      .eq("firm_id", firmId)
      .eq("is_active", true)
      .order("name");

    if (error) throw error;

    // Get employee counts per branch
    const branchIds = (branches || []).map((b: any) => b.id);
    let employeeCounts: Record<string, number> = {};

    if (branchIds.length > 0) {
      const { data: ebData } = await supabase
        .from("employee_branches")
        .select("branch_id")
        .in("branch_id", branchIds);

      (ebData || []).forEach((eb: any) => {
        employeeCounts[eb.branch_id] = (employeeCounts[eb.branch_id] || 0) + 1;
      });
    }

    const result = (branches || []).map((b: any) => ({
      ...b,
      employee_count: employeeCounts[b.id] || 0,
    }));

    return NextResponse.json(result);
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

    if (!["owner", "partner"].includes(profile?.role || "")) {
      return NextResponse.json({ error: "Only owners and partners can create branches" }, { status: 403 });
    }

    const firmId = profile?.firm_id || user.uuid;

    // Check branch limit
    const { count: branchCount } = await supabase
      .from("branches")
      .select("id", { count: "exact", head: true })
      .eq("firm_id", firmId)
      .eq("is_active", true);

    const limitCheck = await checkBranchLimit(firmId, branchCount || 0);
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.message, upgradeRequired: true }, { status: 403 });
    }

    const body = await request.json();
    const { name, address, city, state, pincode, phone, email, operating_hours } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Branch name is required" }, { status: 400 });
    }

    const { data: branch, error } = await supabase
      .from("branches")
      .insert({
        firm_id: firmId,
        name: name.trim(),
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        pincode: pincode?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        operating_hours: operating_hours || {},
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(branch, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
