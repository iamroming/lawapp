import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

function getAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function verifySuperAdmin(request: NextRequest) {
  const user = await verifySessionFromRequest(request);
  if (!user) return null;

  const supabase = getAdminClient();
  const { data } = await supabase
    .from("super_admins")
    .select("id")
    .eq("id", user.uuid)
    .single();

  return data ? user : null;
}

// GET
export async function GET(request: NextRequest) {
  const user = await verifySuperAdmin(request);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = getAdminClient();
  const { data: jobs, error } = await supabase
    .from("cron_jobs")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, jobs });
}

// PATCH
export async function PATCH(request: NextRequest) {
  const user = await verifySuperAdmin(request);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { id, is_enabled, schedule_cron, actions, config, name, description } = body;
  if (!id) return NextResponse.json({ error: "Job ID required" }, { status: 400 });

  const supabase = getAdminClient();
  const updates: Record<string, any> = {};
  if (is_enabled !== undefined) updates.is_enabled = is_enabled;
  if (schedule_cron !== undefined) updates.schedule_cron = schedule_cron;
  if (actions !== undefined) updates.actions = actions;
  if (config !== undefined) updates.config = config;
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;

  const { data, error } = await supabase
    .from("cron_jobs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, job: data });
}

// POST
export async function POST(request: NextRequest) {
  const user = await verifySuperAdmin(request);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { name, slug, description, endpoint, schedule_cron, actions, config } = body;
  if (!name || !slug || !endpoint) return NextResponse.json({ error: "name, slug, endpoint required" }, { status: 400 });

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("cron_jobs")
    .insert({
      name,
      slug,
      description: description || "",
      endpoint,
      schedule_cron: schedule_cron || "0 9 * * *",
      actions: actions || { email: false, whatsapp: false, in_app: false, database: false },
      config: config || {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, job: data });
}

// DELETE
export async function DELETE(request: NextRequest) {
  const user = await verifySuperAdmin(request);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Job ID required" }, { status: 400 });

  const supabase = getAdminClient();
  const { error } = await supabase.from("cron_jobs").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
