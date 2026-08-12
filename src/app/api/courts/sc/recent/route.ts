import { NextRequest, NextResponse } from "next/server";
import { courtServiceFetch } from "@/lib/court-service";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // Try court service first
    const data = await courtServiceFetch(`/api/sc/recent-judgments?limit=${limit}`);
    if (Array.isArray(data) && data.length > 0) {
      return NextResponse.json(data);
    }

    // Fallback: Indian Kanoon API for Supreme Court recent judgments
    const apiKey = process.env.INDIAN_KANOON_API_KEY;
    if (!apiKey) {
      return NextResponse.json([]);
    }

    try {
      const params = new URLSearchParams({
        query: "court:supreme court of india",
        sort: "date",
        page: "0",
        tokens: String(limit),
      });

      const res = await fetch(`https://api.indiankanoon.org/search/formText/?${params}`, {
        headers: { Authorization: `Token ${apiKey}` },
      });

      if (!res.ok) return NextResponse.json([]);

      const kanoonData = await res.json();
      const results = (kanoonData.results || []).slice(0, limit).map((doc: any) => ({
        title: doc.title || "Untitled",
        case_number: doc.docsource || "",
        judgment_date: doc.docdate || "",
        pdf_url: doc.doc_url || `https://indiankanoon.org/doc/${doc.docid}/`,
        source_id: String(doc.docid),
        court: "Supreme Court of India",
      }));

      return NextResponse.json(results);
    } catch {
      return NextResponse.json([]);
    }
  } catch (error: any) {
    return NextResponse.json({ data: [], error: error.message }, { status: 500 });
  }
}
