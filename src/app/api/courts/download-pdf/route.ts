import { NextRequest, NextResponse } from "next/server";
import { courtServiceFetch, buildQueryString } from "@/lib/court-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pdf_url = searchParams.get("pdf_url");

    if (!pdf_url) {
      return NextResponse.json({ error: "pdf_url is required" }, { status: 400 });
    }

    const data = await courtServiceFetch(`/api/hc/download-order?pdf_url=${encodeURIComponent(pdf_url)}`);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
