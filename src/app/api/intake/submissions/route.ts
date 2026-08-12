import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const formId = searchParams.get("form_id");

  let query = supabase
    .from("intake_submissions")
    .select("*, intake_forms!inner(title, user_id)")
    .order("created_at", { ascending: false });

  if (formId) {
    query = query.eq("form_id", formId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const filtered = (data || []).filter(
    (s: any) => s.intake_forms?.user_id === user.uuid
  );
  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Rate limit: 10 submissions per minute per IP
  const ip = getClientIp(request);
  const { allowed } = await checkRateLimit(`intake:${ip}`, { windowMs: 60000, maxRequests: 10 });
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { form_id, client_name, client_email, client_phone, data: responses } = body;

    if (!form_id || !responses || typeof responses !== "object") {
      return NextResponse.json({ error: "form_id and data object are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("intake_submissions")
      .insert({
        form_id,
        client_name: client_name || "Anonymous",
        client_email: client_email || null,
        client_phone: client_phone || null,
        data: responses,
        status: "new",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
