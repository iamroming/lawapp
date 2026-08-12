import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.uuid).single();
  if (!profile?.firm_id) return NextResponse.json({ error: "No firm" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const clientId = searchParams.get("client_id");

  let query = supabase
    .from("quotations")
    .select("*, client:clients(id,full_name,phone,email)")
    .eq("firm_id", profile.firm_id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (clientId) query = query.eq("client_id", clientId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ quotations: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.uuid).single();
  if (!profile?.firm_id) return NextResponse.json({ error: "No firm" }, { status: 400 });

  const body = await req.json();
  const { client_id, case_id, title, description, items, tax_rate, discount_amount, valid_until, notes, terms } = body;

  if (!title || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Title and items array are required" }, { status: 400 });
  }

  const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
  const taxAmount = subtotal * ((tax_rate || 0) / 100);
  const total = subtotal + taxAmount - (discount_amount || 0);

  const { data, error } = await supabase
    .from("quotations")
    .insert({
      firm_id: profile.firm_id,
      client_id: client_id || null,
      case_id: case_id || null,
      title,
      description: description || null,
      items,
      subtotal,
      tax_rate: tax_rate || 0,
      tax_amount: taxAmount,
      discount_amount: discount_amount || 0,
      total_amount: total,
      valid_until: valid_until || null,
      notes: notes || null,
      terms: terms || null,
      created_by: user.uuid,
      status: "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ quotation: data });
}
