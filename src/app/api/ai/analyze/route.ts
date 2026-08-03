import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { checkAiQueryLimit, logAiQuery } from "@/lib/subscription-limits";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: max 10 AI requests per hour
  const ip = getClientIp(request);
  const { allowed } = await checkRateLimit(`ai:${user.id}:${ip}`, { windowMs: 3600000, maxRequests: 10 });
  if (!allowed) {
    return NextResponse.json({ error: "AI rate limit exceeded. Max 10 requests per hour." }, { status: 429 });
  }

  // Check per-plan AI query quota
  const quotaCheck = await checkAiQueryLimit(user.id);
  if (!quotaCheck.allowed) {
    return NextResponse.json({ error: quotaCheck.message }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { caseId, description, case_type, caseType: ct } = body;
    const caseType = case_type || ct;

    let finalDescription = description;
    let finalTitle = body.title || "Untitled Case";
    let finalCourt = body.court || "District Court";

    if (caseId && !description) {
      const { data: caseData } = await supabase
        .from("cases")
        .select("title, description, case_type, court, client:clients(full_name)")
        .eq("id", caseId)
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

    // Log AI query for quota tracking
    await logAiQuery(user.id, "analyze");

    return NextResponse.json({ data: analysis });
  } catch (error) {
    console.error("AI analysis error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
