import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.uuid)
    .single();
  const firmId = profile?.firm_id;

  const { id } = await params;
  const { data, error } = await supabase
    .from("quotations")
    .select("*, client:clients(id,full_name,phone,email,address), case:cases(id,case_number,title)")
    .eq("id", id)
    .eq("firm_id", firmId)
    .is("deleted_at", null)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ quotation: data });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.uuid)
    .single();
  const firmId = profile?.firm_id;

  const { id } = await params;
  const body = await req.json();
  const updates: any = { updated_at: new Date().toISOString() };

  if (body.status) {
    updates.status = body.status;
    if (body.status === "sent") updates.sent_at = new Date().toISOString();
    if (body.status === "accepted") updates.accepted_at = new Date().toISOString();
    if (body.status === "rejected") updates.rejected_at = new Date().toISOString();
  }

  for (const key of ["title", "description", "client_id", "case_id", "items", "tax_rate", "discount_amount", "valid_until", "notes", "terms"]) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  if (body.items) {
    const subtotal = body.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
    const taxAmount = subtotal * ((body.tax_rate || 0) / 100);
    updates.subtotal = subtotal;
    updates.tax_amount = taxAmount;
    updates.total_amount = subtotal + taxAmount - (body.discount_amount || 0);
  }

  const { data, error } = await supabase.from("quotations").update(updates).eq("id", id).eq("firm_id", firmId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ quotation: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.uuid)
    .single();
  const firmId = profile?.firm_id;

  const { id } = await params;
  const { error } = await supabase.from("quotations").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("firm_id", firmId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
