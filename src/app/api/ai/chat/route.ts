import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { checkAiQueryLimit, logAiQuery } from "@/lib/subscription-limits";

const AI_API_KEY = process.env.AI_API_KEY;
const AI_BASE_URL = process.env.AI_BASE_URL || "https://opencode.ai/zen/v1";
const AI_MODEL = process.env.AI_MODEL || "mimo-v2.5-free";

const SYSTEM_PROMPT = `You are CaseFiles AI, a legal assistant specializing in Indian law. You help lawyers with:
- Legal research and case analysis
- Drafting legal documents
- Understanding legal provisions and sections
- Case strategy suggestions
- Client communication templates

Always provide accurate information based on Indian legal system. If unsure, acknowledge limitations. Use professional legal language. Reference specific sections of Indian acts when applicable.`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(request);
  const { allowed } = await checkRateLimit(`ai-chat:${user.uuid}:${ip}`, {
    windowMs: 3600000,
    maxRequests: 20,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "AI rate limit exceeded. Max 20 requests per hour." },
      { status: 429 }
    );
  }

  // Check per-plan AI query quota
  const quotaCheck = await checkAiQueryLimit(user.uuid);
  if (!quotaCheck.allowed) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.uuid).single();
    const isOwnerOrPartner = ["owner", "partner"].includes(profile?.role || "");
    const message = isOwnerOrPartner
      ? `You've reached your ${quotaCheck.plan} plan limit of ${quotaCheck.limit} AI queries per day. Upgrade your plan for more.`
      : `Your firm has reached the ${quotaCheck.plan} plan limit of ${quotaCheck.limit} AI queries per day. Contact the firm owner to upgrade.`;
    return NextResponse.json({ error: message }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    const ALLOWED_ROLES = ["user", "assistant"];
    const MAX_MESSAGE_CONTENT_LENGTH = 10000;
    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.slice(-20).map((m: { role: string; content: string }) => ({
        role: ALLOWED_ROLES.includes(m.role) ? m.role : "user",
        content: m.content.substring(0, MAX_MESSAGE_CONTENT_LENGTH),
      })),
    ];

    if (!AI_API_KEY) {
      return NextResponse.json(
        { error: "AI service is not configured. Please set the AI_API_KEY environment variable to enable the AI chatbot." },
        { status: 503 }
      );
    }

    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      return NextResponse.json({ error: "AI service error" }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "AI returned empty response" }, { status: 502 });
    }

    // Log AI query for quota tracking (only on success)
    await logAiQuery(user.uuid, "chat");

    return NextResponse.json({
      data: { role: "assistant", content },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
