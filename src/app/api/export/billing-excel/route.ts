import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { generateBillingExcel } from "@/lib/excel-export";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(req);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.uuid).single();
  const firmId = profile?.firm_id || user.uuid;

  const { data: cases } = await supabase
    .from("cases")
    .select("case_number, title, status, total_fee, amount_received, client:clients(full_name)")
    .eq("firm_id", firmId)
    .is("deleted_at", null)
    .not("total_fee", "is", null)
    .order("created_at", { ascending: false });

  const buffer = generateBillingExcel(cases || []);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="billing-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
