import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: max 10 AI requests per hour
  const ip = getClientIp(request);
  const { allowed } = await checkRateLimit(`ai-research:${user.id}:${ip}`, { windowMs: 3600000, maxRequests: 10 });
  if (!allowed) {
    return NextResponse.json({ error: "AI rate limit exceeded. Max 10 requests per hour." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { query, act, section } = body;

    if (!query || typeof query !== "string" || query.trim().length < 3) {
      return NextResponse.json({ error: "Search query is required (min 3 characters)" }, { status: 400 });
    }

    if (query.length > 500) {
      return NextResponse.json({ error: "Query too long (max 500 characters)" }, { status: 400 });
    }

    // Import AI service
    const { searchLegalResearch } = await import("@/lib/ai/service");

    const results = await searchLegalResearch(query.trim());

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: "Research failed" }, { status: 500 });
  }
}
