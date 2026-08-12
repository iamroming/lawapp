import { NextRequest, NextResponse } from "next/server";
import { courtServiceFetch, buildQueryString } from "@/lib/court-service";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

const HIGH_COURT_MAP: Record<string, string> = {
  "1": "bombay", "2": "delhi", "3": "madras", "4": "calcutta",
  "5": "karnataka", "6": "allahabad", "7": "rajasthan", "8": "patna",
  "9": "gujarat", "10": "andhra", "11": "telangana", "12": "kerala",
  "13": "madhya pradesh", "14": "orissa", "15": "sikkim",
  "16": "punjab and haryana", "17": "himachal pradesh", "18": "uttarakhand",
  "19": "jammu and kashmir", "20": "chhattisgarh", "21": "jharkhand",
  "22": "tripura", "23": "meghalaya", "24": "manipur", "25": "nagaland",
  "26": "goa", "27": "manipur", "28": "arunachal pradesh", "29": "mizoram",
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);

    const qs = buildQueryString({
      court_code: searchParams.get("court_code"),
      page_size: searchParams.get("page_size") || "10",
    });

    // Try court service first
    const data = await courtServiceFetch(`/api/hc/recent-judgments?${qs}`);
    if (Array.isArray(data) && data.length > 0) {
      return NextResponse.json(data);
    }

    // Fallback: Indian Kanoon API
    const apiKey = process.env.INDIAN_KANOON_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ results: [] });
    }

    try {
      const courtCode = searchParams.get("court_code") || "";
      const courtName = HIGH_COURT_MAP[courtCode] || "high court";
      const pageSize = parseInt(searchParams.get("page_size") || "10");

      const params = new URLSearchParams({
        query: `court:${courtName}`,
        sort: "date",
        page: "0",
        tokens: String(pageSize),
      });

      const res = await fetch(`https://api.indiankanoon.org/search/formText/?${params}`, {
        headers: { Authorization: `Token ${apiKey}` },
      });

      if (!res.ok) return NextResponse.json({ results: [] });

      const kanoonData = await res.json();
      const results = (kanoonData.results || []).slice(0, pageSize).map((doc: any) => ({
        title: doc.title || "Untitled",
        case_number: doc.docsource || "",
        judgment_date: doc.docdate || "",
        pdf_url: doc.doc_url || `https://indiankanoon.org/doc/${doc.docid}/`,
        source_id: String(doc.docid),
        court: courtName,
      }));

      return NextResponse.json({ results });
    } catch {
      return NextResponse.json({ results: [] });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
