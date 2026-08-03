import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase.from("tags").select("*").eq("created_by", user.id).order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const name = body.name?.trim();
  if (!name || name.length < 1 || name.length > 50) {
    return NextResponse.json({ error: "Tag name is required (1-50 characters)" }, { status: 400 });
  }

  // Check for duplicate tag name for this user
  const { data: existing } = await supabase
    .from("tags")
    .select("id")
    .eq("created_by", user.id)
    .ilike("name", name)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "A tag with this name already exists" }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("tags")
    .insert({ name, color: body.color || "#3b82f6", created_by: user.id })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
