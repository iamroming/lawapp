import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, firm_id")
    .eq("id", user.uuid)
    .single();

  const isOwnerOrPartner = ["owner", "partner", "super_admin"].includes(profile?.role || "");

  // Owners/partners see all firm tags; others see own tags
  const { data, error } = isOwnerOrPartner && profile?.firm_id
    ? await supabase.from("tags").select("*").eq("firm_id", profile.firm_id).order("name")
    : await supabase.from("tags").select("*").eq("created_by", user.uuid).order("name");

  if (error) {
    console.error("Failed to fetch tags:", error.message);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, firm_id")
    .eq("id", user.uuid)
    .single();

  const readOnlyRoles = ["employee", "intern"];
  if (readOnlyRoles.includes(profile?.role || "")) {
    return NextResponse.json({ error: "You do not have permission to create tags" }, { status: 403 });
  }

  const body = await request.json();
  const name = body.name?.trim();
  if (!name || name.length < 1 || name.length > 50) {
    return NextResponse.json({ error: "Tag name is required (1-50 characters)" }, { status: 400 });
  }

  const firmId = profile?.firm_id || user.uuid;

  // Check for duplicate tag name for this firm
  const { data: existing } = await supabase
    .from("tags")
    .select("id")
    .eq("firm_id", firmId)
    .ilike("name", name)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "A tag with this name already exists" }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("tags")
    .insert({ name, color: body.color || "#3b82f6", created_by: user.uuid, firm_id: firmId })
    .select()
    .single();
  if (error) {
    console.error("Failed to create tag:", error.message);
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
