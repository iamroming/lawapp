import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

// GET — list tasks
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const caseId = searchParams.get("case_id");
    const assignedTo = searchParams.get("assigned_to");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const { data: profile } = await supabase
      .from("profiles").select("firm_id, role").eq("id", user.uuid).single();

    let query = supabase
      .from("tasks")
      .select("*, cases(id, title, case_number), clients(id, full_name), assigned_user:profiles!tasks_assigned_to_fkey(full_name)")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (profile?.firm_id && ["owner", "partner"].includes(profile.role || "")) {
      query = query.eq("firm_id", profile.firm_id);
    } else {
      query = query.or(`user_id.eq.${user.uuid},assigned_to.eq.${user.uuid}`);
    }

    if (status) query = query.eq("status", status);
    if (priority) query = query.eq("priority", priority);
    if (caseId) query = query.eq("case_id", caseId);
    if (assignedTo) query = query.eq("assigned_to", assignedTo);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}

// POST — create a task
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { title, description, case_id, client_id, assigned_to, priority, due_date } = body;

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const { data: profile } = await supabase
      .from("profiles").select("firm_id, role").eq("id", user.uuid).single();

    // Role check: owner/partner/senior_associate/associate can create tasks
    const taskCreateRoles = ["owner", "partner", "senior_associate", "associate", "super_admin"];
    if (!profile?.role || !taskCreateRoles.includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden: you do not have permission to create tasks" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: user.uuid,
        case_id: case_id || null,
        client_id: client_id || null,
        firm_id: profile?.firm_id || null,
        assigned_to: assigned_to || null,
        title,
        description: description || null,
        priority: priority || "medium",
        due_date: due_date || null,
      })
      .select("*, cases(id, title, case_number), clients(id, full_name), assigned_user:profiles!tasks_assigned_to_fkey(full_name)")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}

// PATCH — update a task (status change, reassign, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, title, description, status, priority, due_date, assigned_to, case_id, client_id } = body;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.uuid).single();
    const firmId = profile?.firm_id;

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (due_date !== undefined) updates.due_date = due_date;
    if (assigned_to !== undefined) updates.assigned_to = assigned_to;
    if (case_id !== undefined) updates.case_id = case_id;
    if (client_id !== undefined) updates.client_id = client_id;
    updates.updated_at = new Date().toISOString();

    let updateQuery = supabase
      .from("tasks")
      .update(updates)
      .eq("id", id);
    if (firmId) {
      updateQuery = updateQuery.eq("firm_id", firmId);
    } else {
      updateQuery = updateQuery.eq("user_id", user.uuid);
    }

    const { data, error } = await updateQuery
      .select("*, cases(id, title, case_number), clients(id, full_name), assigned_user:profiles!tasks_assigned_to_fkey(full_name)")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.uuid).single();
    const firmId = profile?.firm_id;

    let deleteQuery = supabase.from("tasks").delete().eq("id", id);
    if (firmId) {
      deleteQuery = deleteQuery.eq("firm_id", firmId);
    } else {
      deleteQuery = deleteQuery.eq("user_id", user.uuid);
    }
    const { error } = await deleteQuery;
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}
