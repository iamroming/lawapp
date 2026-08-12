import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

// GET — list expenses for the current user/firm
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("case_id");
    const clientId = searchParams.get("client_id");
    const category = searchParams.get("category");
    const billable = searchParams.get("billable");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    let query = supabase
      .from("expenses")
      .select("*, cases(id, title, case_number), clients(id, full_name)")
      .order("expense_date", { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by user's firm or direct ownership
    const { data: profile } = await supabase
      .from("profiles")
      .select("firm_id, role")
      .eq("id", user.uuid)
      .single();

    if (profile?.firm_id && ["owner", "partner"].includes(profile.role || "")) {
      query = query.eq("firm_id", profile.firm_id);
    } else {
      query = query.eq("user_id", user.uuid);
    }

    if (caseId) query = query.eq("case_id", caseId);
    if (clientId) query = query.eq("client_id", clientId);
    if (category) query = query.eq("category", category);
    if (billable !== null && billable !== undefined) query = query.eq("is_billable", billable === "true");
    if (startDate) query = query.gte("expense_date", startDate);
    if (endDate) query = query.lte("expense_date", endDate);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}

// POST — create an expense
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { case_id, client_id, title, description, amount, category, is_billable, receipt_url, expense_date } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (amount === undefined || amount === null || typeof amount !== "number" || amount < 0) {
      return NextResponse.json({ error: "A valid amount is required (must be a non-negative number)" }, { status: 400 });
    }

    if (description !== undefined && description !== null && typeof description !== "string") {
      return NextResponse.json({ error: "Description must be a string" }, { status: 400 });
    }

    if (category !== undefined && category !== null && typeof category !== "string") {
      return NextResponse.json({ error: "Category must be a string" }, { status: 400 });
    }

    // Get user's firm_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("firm_id")
      .eq("id", user.uuid)
      .single();

    if (case_id) {
      const { data: caseRecord } = await supabase
        .from("cases")
        .select("id")
        .eq("id", case_id)
        .eq("firm_id", profile?.firm_id || "")
        .single();
      if (!caseRecord) {
        return NextResponse.json({ error: "Case not found in your firm" }, { status: 404 });
      }
    }

    if (client_id) {
      const { data: clientRecord } = await supabase
        .from("clients")
        .select("id")
        .eq("id", client_id)
        .eq("firm_id", profile?.firm_id || "")
        .single();
      if (!clientRecord) {
        return NextResponse.json({ error: "Client not found in your firm" }, { status: 404 });
      }
    }

    const { data, error } = await supabase
      .from("expenses")
      .insert({
        user_id: user.uuid,
        case_id: case_id || null,
        client_id: client_id || null,
        firm_id: profile?.firm_id || null,
        title,
        description: description || null,
        amount,
        category: category || "other",
        is_billable: is_billable !== false,
        receipt_url: receipt_url || null,
        expense_date: expense_date || new Date().toISOString().split("T")[0],
      })
      .select("*, cases(id, title, case_number), clients(id, full_name)")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}

// PATCH — update an expense
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("firm_id, role").eq("id", user.uuid).single();
    const firmId = profile?.firm_id;

    const allowedRoles = ["owner", "partner"];
    if (!profile?.role || !allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const { id, title, description, amount, category, is_billable, receipt_url, expense_date, case_id, client_id } = body;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (amount !== undefined) updates.amount = amount;
    if (category !== undefined) updates.category = category;
    if (is_billable !== undefined) updates.is_billable = is_billable;
    if (receipt_url !== undefined) updates.receipt_url = receipt_url;
    if (expense_date !== undefined) updates.expense_date = expense_date;
    if (case_id !== undefined) updates.case_id = case_id;
    if (client_id !== undefined) updates.client_id = client_id;
    updates.updated_at = new Date().toISOString();

    let query = supabase.from("expenses").update(updates).eq("id", id);
    if (firmId) {
      query = query.eq("firm_id", firmId);
    } else {
      query = query.eq("user_id", user.uuid);
    }
    const { data, error } = await query.select().single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}

// DELETE — delete an expense
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("firm_id, role").eq("id", user.uuid).single();
    const firmId = profile?.firm_id;

    const allowedRoles = ["owner", "partner"];
    if (!profile?.role || !allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const { error } = await supabase
      .from("expenses")
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq(firmId ? "firm_id" : "user_id", firmId || user.uuid);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}
