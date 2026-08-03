import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password, full_name, phone, firm_name, signup_mode } = body;

  if (!email || !password || !full_name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // email_confirm: false requires Supabase SMTP to be configured
  // Set to false once SMTP is set up in Supabase Dashboard > Authentication > Email Templates
  const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: {
      full_name,
      phone,
      firm_name,
      signup_mode,
    },
  });

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 });
  }

  if (!userData.user) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }

  if (signup_mode === "owner") {
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: userData.user.id,
      full_name: full_name || "",
      email: email,
      phone: phone || "",
      firm_name: firm_name || "",
      role: "owner",
      firm_id: userData.user.id,
      is_active: true,
    }, { onConflict: "id" });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, user_id: userData.user.id });
}
