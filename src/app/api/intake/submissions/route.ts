import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const formId = searchParams.get("form_id");

  let query = supabase
    .from("intake_submissions")
    .select("*, intake_forms(title, created_by)")
    .order("created_at", { ascending: false });

  if (formId) {
    query = query.eq("form_id", formId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const filtered = (data || []).filter(
    (s: any) => s.intake_forms?.created_by === user.id
  );
  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const { form_id, submitter_name, submitter_email, submitter_phone, responses } = body;

    if (!form_id || !responses || typeof responses !== "object") {
      return NextResponse.json({ error: "form_id and responses object are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("intake_submissions")
      .insert({
        form_id,
        submitter_name: submitter_name || null,
        submitter_email: submitter_email || null,
        submitter_phone: submitter_phone || null,
        responses,
        status: "submitted",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
