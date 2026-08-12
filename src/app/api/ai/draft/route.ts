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
  const { allowed } = await checkRateLimit(`ai-draft:${user.uuid}:${ip}`, {
    windowMs: 3600000,
    maxRequests: 10,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "AI rate limit exceeded. Max 10 requests per hour." },
      { status: 429 }
    );
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
    const { documentType, jurisdiction, partyDetails, facts, reliefSought, additionalInstructions } =
      body;

    if (!documentType || typeof documentType !== "string") {
      return NextResponse.json({ error: "documentType is required" }, { status: 400 });
    }
    if (!facts || typeof facts !== "string" || facts.trim().length < 10) {
      return NextResponse.json(
        { error: "Facts are required (min 10 characters)" },
        { status: 400 }
      );
    }

    const { generateLegalDraft } = await import("@/lib/ai/drafting");

    const draft = await generateLegalDraft({
      documentType,
      jurisdiction: jurisdiction || "India",
      partyDetails: partyDetails || "",
      facts: facts.trim(),
      reliefSought: reliefSought || "",
      additionalInstructions: additionalInstructions || "",
    });

    await logAiQuery(user.uuid, "drafting");

    return NextResponse.json({ data: draft });
  } catch (error) {
    console.error("AI draft error:", error);
    return NextResponse.json({ error: "Draft generation failed" }, { status: 500 });
  }
}
