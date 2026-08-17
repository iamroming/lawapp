import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { signupSchema } from "@/lib/validators";
import { getAdminAuth } from "@/lib/firebase/admin";
import { firebaseUidToUuid } from "@/lib/firebase/uid";

const signupAttempts = new Map<string, { count: number; resetAt: number }>();

function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [ip, record] of signupAttempts) {
    if (now > record.resetAt) {
      signupAttempts.delete(ip);
    }
  }
}

function checkSignupRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxAttempts = 5;

  const record = signupAttempts.get(ip);
  if (!record || now > record.resetAt) {
    signupAttempts.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxAttempts) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: Request) {
  cleanupExpiredEntries();
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  if (!checkSignupRateLimit(ip)) {
    return NextResponse.json({ error: "Too many signup attempts. Please try again later." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { email, password, full_name, phone, firm_name, signup_mode, invite_code, website } = body;

  if (website && typeof website === "string" && website.length > 0) {
    return NextResponse.json({ success: true });
  }

  const parsed = signupSchema.safeParse({
    email,
    password,
    fullName: full_name,
    phone: phone || "0000000000",
    firmName: firm_name,
  });

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const firstError = Object.values(errors)[0]?.[0] || "Invalid input";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  if (signup_mode !== "owner" && signup_mode !== "employee") {
    return NextResponse.json({ error: "Invalid signup mode" }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let inviteData: Record<string, unknown> | null = null;
  if (signup_mode === "employee") {
    if (!invite_code || typeof invite_code !== "string") {
      return NextResponse.json({ error: "Invite code is required for team member signup" }, { status: 400 });
    }

    const normalizedCode = invite_code.trim().toUpperCase();

    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("team_invites")
      .select("*")
      .eq("code", normalizedCode)
      .eq("is_active", true)
      .is("used_by", null)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invalid or already used invite code" }, { status: 400 });
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invite code has expired" }, { status: 400 });
    }

    inviteData = invite;
  }

  let userData: { uid: string };
  try {
    const auth = await getAdminAuth();
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: full_name as string || undefined,
      emailVerified: false,
    });
    userData = { uid: userRecord.uid };
  } catch (createError: any) {
    if (createError.code === "auth/email-already-exists") {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 400 }
      );
    }
    console.error("Firebase createUser error:", createError.message, createError.code);
    return NextResponse.json(
      { error: "An account with this email may already exist. Please try again." },
      { status: 400 }
    );
  }

  const profileUuid = firebaseUidToUuid(userData.uid);

  try {
    if (signup_mode === "owner") {
      const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
        id: profileUuid,
        full_name: full_name || "",
        email: email,
        phone: phone || "",
        firm_name: firm_name || "",
        role: "owner",
        firm_id: profileUuid,
        is_active: true,
      }, { onConflict: "id" });

      if (profileError) {
        throw profileError;
      }
    } else if (signup_mode === "employee" && inviteData) {
      const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
        id: profileUuid,
        full_name: full_name || "",
        email: email,
        phone: phone || "",
        firm_name: firm_name || "",
        role: inviteData.role_id as string,
        firm_id: inviteData.firm_id as string,
        is_active: true,
        payment_type: (inviteData as any).payment_type || null,
        monthly_salary: (inviteData as any).monthly_salary || null,
        percentage_rate: (inviteData as any).percentage_rate || null,
        upi_id: (inviteData as any).upi_id || null,
        allotment_status: (inviteData as any).allotment_status || null,
        pf_enabled: (inviteData as any).pf_enabled ?? null,
        esi_enabled: (inviteData as any).esi_enabled ?? null,
        tds_rate: (inviteData as any).tds_rate || null,
      }, { onConflict: "id" });

      if (profileError) {
        throw profileError;
      }

      const { error: inviteUpdateError } = await supabaseAdmin
        .from("team_invites")
        .update({
          used_by: profileUuid,
          used_at: new Date().toISOString(),
          is_active: false,
        })
        .eq("id", inviteData.id as string);

      if (inviteUpdateError) {
        console.error("Failed to mark invite as used:", inviteUpdateError.message);
      }
    }
  } catch (profileError) {
    try {
      await (await getAdminAuth()).deleteUser(userData.uid);
    } catch (deleteError: any) {
      console.error("Failed to delete orphaned auth user after profile failure:", deleteError.message);
    }
    console.error("Profile creation failed:", profileError);
    return NextResponse.json({ error: "Failed to complete signup. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true, user_id: userData.uid });
}
