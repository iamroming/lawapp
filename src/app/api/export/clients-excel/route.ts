import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { generateClientsExcel } from "@/lib/excel-export";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(req);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.uuid).single();
  const firmId = profile?.firm_id || user.uuid;

  const { data: clients } = await supabase
    .from("clients")
    .select("id, full_name, email, phone, address, created_at")
    .eq("firm_id", firmId)
    .is("deleted_at", null)
    .order("full_name");

  const clientsWithCounts = await Promise.all(
    (clients || []).map(async (c) => {
      const { count } = await supabase
        .from("cases")
        .select("id", { count: "exact", head: true })
        .eq("client_id", c.id)
        .is("deleted_at", null);
      return { ...c, case_count: count || 0 };
    })
  );

  const buffer = generateClientsExcel(clientsWithCounts);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="clients-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
