import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { checkAiQueryLimit, logAiQuery } from "@/lib/subscription-limits";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(request);
  const { allowed } = await checkRateLimit(`ai-research:${user.uuid}:${ip}`, { windowMs: 3600000, maxRequests: 10 });
  if (!allowed) {
    return NextResponse.json({ error: "AI rate limit exceeded. Max 10 requests per hour." }, { status: 429 });
  }

  const quotaCheck = await checkAiQueryLimit(user.uuid);
  if (!quotaCheck.allowed) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.uuid).single();
    const isOwnerOrPartner = ["owner", "partner"].includes(profile?.role || "");
    const message = isOwnerOrPartner
      ? `You've reached your ${quotaCheck.plan} plan limit of ${quotaCheck.limit} AI queries per day. Upgrade your plan for more.`
      : `Your firm has reached the ${quotaCheck.plan} plan limit of ${quotaCheck.limit} AI queries per day. Contact the firm owner to upgrade.`;
    return NextResponse.json({ error: message, limitReached: true, limit: quotaCheck.limit, used: quotaCheck.used, plan: quotaCheck.plan }, { status: 429 });
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

    const topic = [act, section].filter(Boolean).join(" - ") || undefined;
    const results = await searchLegalResearch(query.trim(), topic);

    if (!results) {
      return NextResponse.json({ error: "Research failed" }, { status: 500 });
    }

    await logAiQuery(user.uuid, "research");

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: "Research failed" }, { status: 500 });
  }
}
