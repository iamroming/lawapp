import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { checkAiQueryLimit, logAiQuery } from "@/lib/subscription-limits";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: max 10 AI requests per hour
  const ip = getClientIp(request);
  const { allowed } = await checkRateLimit(`ai:${user.uuid}:${ip}`, { windowMs: 3600000, maxRequests: 10 });
  if (!allowed) {
    return NextResponse.json({ error: "AI rate limit exceeded. Max 10 requests per hour." }, { status: 429 });
  }

  // Check per-plan AI query quota
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
    const { caseId, description, case_type, caseType: ct } = body;
    const caseType = case_type || ct;

    let finalDescription = description;
    let finalTitle = body.title || "Untitled Case";
    let finalCourt = body.court || "District Court";

    if (caseId && !description) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("firm_id")
        .eq("id", user.uuid)
        .single();

      const firmId = profile?.firm_id || user.uuid;

      const { data: caseData } = await supabase
        .from("cases")
        .select("title, description, case_type, court, client:clients(full_name)")
        .eq("id", caseId)
        .eq("firm_id", firmId)
        .is("deleted_at", null)
        .single();

      if (caseData) {
        finalTitle = caseData.title || finalTitle;
        finalDescription = caseData.description || "";
        finalCourt = caseData.court || finalCourt;
      }
    }

    if (!finalDescription || typeof finalDescription !== "string" || finalDescription.trim().length < 10) {
      return NextResponse.json({ error: "Description is required (min 10 characters)" }, { status: 400 });
    }

    if (finalDescription.length > 5000) {
      return NextResponse.json({ error: "Description too long (max 5000 characters)" }, { status: 400 });
    }

    // Import AI service
    const { analyzeCase } = await import("@/lib/ai/service");

    const analysis = await analyzeCase({
      caseId,
      title: finalTitle,
      description: finalDescription.trim(),
      caseType,
      court: finalCourt,
    });

    if (!analysis) {
      return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
    }

    // Log AI query for quota tracking (only on success)
    await logAiQuery(user.uuid, "analyze");

    return NextResponse.json({ data: analysis });
  } catch (error) {
    console.error("AI analysis error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
