import { NextRequest, NextResponse } from "next/server";
import { courtServiceFetch, buildQueryString } from "@/lib/court-service";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

const ALLOWED_PDF_DOMAINS = [/\.ecourtsindia\.com$/i, /\.gov\.in$/i, /\.indiacourt\.nic\.in$/i];

function isAllowedPdfUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  return ALLOWED_PDF_DOMAINS.some((re) => re.test(parsed.hostname));
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const pdf_url = searchParams.get("pdf_url");

    if (!pdf_url) {
      return NextResponse.json({ error: "pdf_url is required" }, { status: 400 });
    }

    if (!isAllowedPdfUrl(pdf_url)) {
      return NextResponse.json({ error: "pdf_url domain not allowed" }, { status: 400 });
    }

    const data = await courtServiceFetch(`/api/hc/download-order?pdf_url=${encodeURIComponent(pdf_url)}`);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
