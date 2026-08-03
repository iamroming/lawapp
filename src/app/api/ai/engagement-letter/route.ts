import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(request);
  const { allowed } = await checkRateLimit(`ai-engagement:${user.id}:${ip}`, {
    windowMs: 3600000,
    maxRequests: 10,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "AI rate limit exceeded. Max 10 requests per hour." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { clientName, clientAddress, matterDescription, feeStructure, firmName, advocateName, jurisdiction } =
      body;

    if (!clientName || !matterDescription) {
      return NextResponse.json(
        { error: "clientName and matterDescription are required" },
        { status: 400 }
      );
    }

    const { generateEngagementLetter } = await import("@/lib/ai/drafting");

    const result = await generateEngagementLetter({
      clientName,
      clientAddress: clientAddress || "",
      matterDescription,
      feeStructure: feeStructure || "",
      firmName: firmName || "",
      advocateName: advocateName || "",
      jurisdiction: jurisdiction || "India",
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("AI engagement letter error:", error);
    return NextResponse.json({ error: "Engagement letter generation failed" }, { status: 500 });
  }
}
