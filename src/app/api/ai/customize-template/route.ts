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
  const { allowed } = await checkRateLimit(`ai-template:${user.id}:${ip}`, {
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
    const { templateId, fieldData } = body;

    if (!templateId || typeof templateId !== "string") {
      return NextResponse.json({ error: "templateId is required" }, { status: 400 });
    }

    const { customizeTemplateWithAI } = await import("@/lib/ai/drafting");
    const { getTemplateById } = await import("@/lib/templates");

    const template = getTemplateById(templateId);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const result = await customizeTemplateWithAI({
      template,
      fieldData: fieldData || {},
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("AI template customization error:", error);
    return NextResponse.json({ error: "Template customization failed" }, { status: 500 });
  }
}
