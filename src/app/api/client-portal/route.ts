import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { client_id, email, phone } = body;

    if (!client_id || (!email && !phone)) return NextResponse.json({ error: "Missing client_id and email/phone" }, { status: 400 });

    const { data: client } = await supabase.from("clients").select("id, full_name, email, phone, created_by").eq("id", client_id).eq("created_by", user.id).single();
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const { data: existing } = await supabase.from("client_portal_users").select("id").eq("client_id", client_id).single();
    if (existing) return NextResponse.json({ error: "Portal access already exists" }, { status: 409 });

    const portalEmail = email || client.email;
    if (!portalEmail) return NextResponse.json({ error: "Client must have an email" }, { status: 400 });

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: portalEmail, email_confirm: true,
      user_metadata: { full_name: client.full_name, role: "client", client_id },
    });
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

    const { data: portalUser, error } = await supabase.from("client_portal_users").insert({
      client_id, user_id: authUser.user.id, email: portalEmail, role: "client",
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Send invitation email via Resend
    try {
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        const firmName = user.email?.split("@")[0] || "Your Law Firm";
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": "Bearer " + resendKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "LawXP <noreply@" + (process.env.EMAIL_DOMAIN || "LawXP.in") + ">",
            to: portalEmail,
            subject: "You're invited to " + firmName + " Client Portal",
            html: "<h2>Welcome to " + firmName + " Client Portal</h2><p>Dear " + client.full_name + ",</p><p>You have been granted access to the client portal of " + firmName + ".</p><p>You can now log in to view your cases, documents, invoices, and communicate with your lawyer.</p><p><strong>Login URL:</strong> " + (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") + "/client-login</p><p>Your login email: " + portalEmail + "</p><p>Please set your password on first login.</p><br/><p>Best regards,<br/>" + firmName + "</p>",
          }),
        });
      }
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
    }

    return NextResponse.json({ data: portalUser, message: "Portal access created and invitation email sent." }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: clients } = await supabase.from("clients").select("id").eq("created_by", user.id);
    if (!clients?.length) return NextResponse.json({ data: [] });

    const { data, error } = await supabase.from("client_portal_users").select("*, client:clients(id, full_name, email, phone)").in("client_id", clients.map((c) => c.id)).order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
