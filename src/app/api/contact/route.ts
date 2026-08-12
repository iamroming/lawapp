import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Name, email, subject, and message are required" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // Store in database
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { error } = await supabase.from("contact_submissions").insert({
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      subject: subject.trim(),
      message: message.trim(),
    });

    if (error) {
      console.error("Failed to store contact submission:", error.message);
      // Still return success to user - we don't want to expose DB errors
    }

    // Send notification email if Resend is configured
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: process.env.EMAIL_FROM || "CaseFiles <noreply@casefiles.in>",
          to: "support@casefiles.in",
          subject: `Contact Form: ${subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">New Contact Form Submission</h1>
              </div>
              <div style="padding: 20px; background: #f9fafb;">
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
                <p><strong>Subject:</strong> ${subject}</p>
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <p><strong>Message:</strong></p>
                  <p>${message.replace(/\n/g, "<br/>")}</p>
                </div>
              </div>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Failed to send contact notification email:", emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
