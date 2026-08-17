import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/referrals/track?code=ABC123 - Track referral when user signs up
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Referral code required" }, { status: 400 });
  }

  const supabase = getAdminClient();

  // Find referrer
  const { data: referrer, error: referrerError } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("referral_code", code.toUpperCase())
    .single();

  if (referrerError || !referrer) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    referrer: {
      id: referrer.id,
      name: referrer.full_name || "A lawyer",
    },
    code: code.toUpperCase(),
  });
}

// POST /api/referrals/track - Record a referral
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { referral_code, referred_email, referred_name, source } = body;

  if (!referral_code || !referred_email) {
    return NextResponse.json({ error: "referral_code and referred_email required" }, { status: 400 });
  }

  const supabase = getAdminClient();

  // Find referrer
  const { data: referrer, error: referrerError } = await supabase
    .from("profiles")
    .select("id")
    .eq("referral_code", referral_code.toUpperCase())
    .single();

  if (referrerError || !referrer) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
  }

  // Find referred user
  const { data: referredUser } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", referred_email)
    .single();

  // Create referral record
  const { data: referral, error: insertError } = await supabase
    .from("referrals")
    .insert({
      referrer_id: referrer.id,
      referred_id: referredUser?.id || null,
      referral_code: referral_code.toUpperCase(),
      status: referredUser ? "signed_up" : "pending",
      source: source || "link",
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, referral });
}

// PATCH /api/referrals/track - Update referral status
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { referral_id, status, referred_id } = body;

  if (!referral_id || !status) {
    return NextResponse.json({ error: "referral_id and status required" }, { status: 400 });
  }

  const supabase = getAdminClient();

  const updates: Record<string, any> = { status };
  if (referred_id) updates.referred_id = referred_id;

  // If converting, mark rewards
  if (status === "converted") {
    updates.rewarded_at = new Date().toISOString();
    updates.referrer_rewarded = true;
    updates.referred_rewarded = true;
  }

  const { data, error } = await supabase
    .from("referrals")
    .update(updates)
    .eq("id", referral_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, referral: data });
}
