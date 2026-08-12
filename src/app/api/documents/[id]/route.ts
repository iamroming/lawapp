import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.uuid).single();
  const firmId = profile?.firm_id;

  const { error } = await supabase.from("documents").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("firm_id", firmId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.rpc("log_activity", {
    p_user_id: user.uuid,
    p_action: "deleted",
    p_entity_type: "document",
    p_entity_id: id,
    p_entity_name: "item",
    p_details: {},
  });

  return NextResponse.json({ success: true });
}
