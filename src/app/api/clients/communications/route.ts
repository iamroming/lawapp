import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("client_id");

  const { data: profile } = await supabase.from("profiles").select("firm_id, role").eq("id", user.uuid).single();
  const firmId = profile?.firm_id || user.uuid;
  const isOwner = ["owner", "partner"].includes(profile?.role || "");

  let query = supabase
    .from("client_communications")
    .select("*")
    .order("created_at", { ascending: false });

  if (isOwner && firmId) {
    // Owners/partners see all firm communications
    const { data: firmClients } = await supabase.from("clients").select("id").eq("firm_id", firmId);
    const clientIds = (firmClients || []).map((c) => c.id);
    if (clientIds.length > 0) {
      query = query.in("client_id", clientIds);
    } else {
      return NextResponse.json([]);
    }
  } else {
    // Employees see only their own communications
    query = query.eq("lawyer_id", user.uuid);
  }

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { client_id, type, subject, content, case_id } = body;

    if (!client_id || !type || !content) {
      return NextResponse.json(
        { error: "client_id, type, and content are required" },
        { status: 400 }
      );
    }

    const validTypes = ["call", "email", "whatsapp", "meeting", "note", "sms"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `type must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify client belongs to user's firm
    const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.uuid).single();
    const firmId = profile?.firm_id || user.uuid;
    const { data: clientRow } = await supabase.from("clients").select("id").eq("id", client_id).eq("firm_id", firmId).single();
    if (!clientRow) return NextResponse.json({ error: "Client not found in your firm" }, { status: 404 });

    const { data, error } = await supabase
      .from("client_communications")
      .insert({
        client_id,
        lawyer_id: user.uuid,
        case_id: case_id || null,
        type,
        subject: subject || null,
        content,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
