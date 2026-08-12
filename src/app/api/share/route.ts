import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, id } = await req.json();

  if (!type || !id) {
    return NextResponse.json({ error: "Type and ID required" }, { status: 400 });
  }

  // Get user's firm_id for ownership verification
  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id, role")
    .eq("id", user.uuid)
    .single();

  const firmId = profile?.firm_id || user.uuid;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  let shareUrl = "";
  let shareText = "";
  let clientPhone = "";

  switch (type) {
    case "invoice": {
      const { data } = await supabase
        .from("invoices")
        .select("id, invoice_number, firm_id, case:cases(case_number, title), client:clients(full_name, phone)")
        .eq("id", id)
        .single();
      if (!data) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      // Verify firm ownership
      if (data.firm_id !== firmId) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
      const client = Array.isArray(data.client) ? data.client[0] : data.client;
      const case_ = Array.isArray(data.case) ? data.case[0] : data.case;
      shareUrl = `${baseUrl}/api/invoices/${id}/pdf`;
      shareText = `📋 Invoice ${data.invoice_number}\nCase: ${case_?.case_number || "N/A"}\nClient: ${client?.full_name || "N/A"}\n\nDownload PDF: ${shareUrl}`;
      clientPhone = client?.phone || "";
      break;
    }
    case "quotation": {
      const { data } = await supabase
        .from("quotations")
        .select("id, quotation_number, title, total_amount, firm_id, client:clients(full_name, phone)")
        .eq("id", id)
        .single();
      if (!data) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
      if (data.firm_id !== firmId) {
        return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
      }
      const client = Array.isArray(data.client) ? data.client[0] : data.client;
      shareUrl = `${baseUrl}/quotations/${id}`;
      shareText = `💰 Quotation ${data.quotation_number}\n${data.title}\nAmount: ₹${data.total_amount?.toLocaleString("en-IN")}\n\nView: ${shareUrl}`;
      clientPhone = client?.phone || "";
      break;
    }
    case "document": {
      const { data } = await supabase
        .from("documents")
        .select("id, title, file_url, file_name, firm_id")
        .eq("id", id)
        .single();
      if (!data) return NextResponse.json({ error: "Document not found" }, { status: 404 });
      if (data.firm_id !== firmId) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }
      // SECURITY: Raw Cloudinary URLs are returned without expiration or signed tokens.
      // This means shared document URLs remain accessible indefinitely.
      // TODO: Implement time-limited signed URLs or a proxy endpoint with token-based access.
      shareUrl = data.file_url;
      shareText = `📄 ${data.title || data.file_name}\n\nDownload: ${shareUrl}`;
      break;
    }
    case "case": {
      const { data } = await supabase
        .from("cases")
        .select("id, case_number, title, court, status, next_hearing_date, firm_id, client:clients(full_name, phone)")
        .eq("id", id)
        .single();
      if (!data) return NextResponse.json({ error: "Case not found" }, { status: 404 });
      if (data.firm_id !== firmId) {
        return NextResponse.json({ error: "Case not found" }, { status: 404 });
      }
      const client = Array.isArray(data.client) ? data.client[0] : data.client;
      shareUrl = `${baseUrl}/cases/${id}`;
      const lines = [`⚖️ Case: ${data.case_number}`, data.title];
      if (data.court) lines.push(`Court: ${data.court}`);
      if (data.next_hearing_date) lines.push(`Next Hearing: ${data.next_hearing_date}`);
      lines.push(`\nView: ${shareUrl}`);
      shareText = lines.join("\n");
      clientPhone = client?.phone || "";
      break;
    }
    default:
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  return NextResponse.json({ shareUrl, shareText, clientPhone });
}
