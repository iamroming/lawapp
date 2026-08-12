import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id");

    if (!clientId) {
      return NextResponse.json({ error: "client_id is required" }, { status: 400 });
    }

    // Verify client belongs to user's firm
    const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.uuid).single();
    const { data: clientCheck } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .eq("firm_id", profile?.firm_id)
      .single();

    if (!clientCheck) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("client_feedback")
      .select("*, case:cases(case_number, title)")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const avgRating =
      data && data.length > 0
        ? data.reduce((sum, f) => sum + f.rating, 0) / data.length
        : 0;

    return NextResponse.json({ data, average_rating: Math.round(avgRating * 10) / 10 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await verifySessionFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { client_id, case_id, rating, feedback_text, feedback_type, is_anonymous } = body;

    if (!client_id || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "client_id and rating (1-5) are required" },
        { status: 400 }
      );
    }

    // Verify client belongs to user's firm
    const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user.uuid).single();
    const { data: clientCheck } = await supabase
      .from("clients")
      .select("id")
      .eq("id", client_id)
      .eq("firm_id", profile?.firm_id)
      .single();

    if (!clientCheck) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("client_feedback")
      .insert({
        client_id,
        case_id: case_id || null,
        user_id: user?.uuid || null,
        rating,
        feedback_text: feedback_text || null,
        feedback_type: feedback_type || "general",
        is_anonymous: is_anonymous || false,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
