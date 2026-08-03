import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkStorageLimit } from "@/lib/subscription-limits";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get("case_id");

  const { data: profile } = await supabase.from("profiles").select("firm_id, role").eq("id", user.id).single();
  const firmId = profile?.firm_id;
  const isOwner = ["owner", "partner"].includes(profile?.role || "");

  let query = supabase
    .from("documents")
    .select("*, case:cases(id, case_number, title), uploader:profiles(full_name)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (isOwner && firmId) {
    query = query.eq("firm_id", firmId);
  } else {
    // Employees see own uploads + docs for assigned cases
    const { data: assignedCases } = await supabase
      .from("cases")
      .select("id")
      .or(`created_by.eq.${user.id},assigned_to.eq.${user.id}`);
    const caseIds = (assignedCases || []).map((c) => c.id);
    query = query.or(`uploaded_by.eq.${user.id},case_id.in.(${caseIds.join(",")})`);
  }

  if (caseId) query = query.eq("case_id", caseId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const docs = (data || []).map((d: any) => ({
    ...d,
    case: Array.isArray(d.case) ? d.case[0] : d.case,
    uploader: Array.isArray(d.uploader) ? d.uploader[0] : d.uploader,
  }));
  return NextResponse.json(docs);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const allowedFields = {
    title: body.title,
    description: body.description,
    case_id: body.case_id || null,
    category: body.category || "other",
    is_confidential: body.is_confidential || false,
    file_url: body.file_url,
    file_path: body.file_path,
    file_name: body.file_name,
    file_type: body.file_type,
    file_size: body.file_size,
  };

  // Validate required fields
  if (!allowedFields.title || typeof allowedFields.title !== "string" || allowedFields.title.trim().length === 0) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  // Check storage limit (existing usage + new file)
  const fileSize = allowedFields.file_size || 0;
  if (fileSize > 0) {
    const { data: existingDocs } = await supabase
      .from("documents")
      .select("file_size")
      .eq("uploaded_by", user.id)
      .is("deleted_at", null);

    const existingBytes = (existingDocs || []).reduce(
      (sum: number, doc: { file_size: number | null }) => sum + (doc.file_size || 0),
      0
    );
    const totalBytes = existingBytes + fileSize;

    const storageCheck = await checkStorageLimit(user.id, totalBytes);
    if (!storageCheck.allowed) {
      return NextResponse.json({ error: storageCheck.message }, { status: 403 });
    }
    if (storageCheck.message) {
      // 80% warning — still allowed, but log it
      console.warn("Storage warning:", storageCheck.message);
    }
  }

  const filteredBody = Object.fromEntries(
    Object.entries(allowedFields).filter(([, v]) => v !== undefined)
  );
  const { data, error } = await supabase
    .from("documents")
    .insert({ ...filteredBody, uploaded_by: user.id })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.rpc("log_activity", {
    p_user_id: user.id,
    p_action: "created",
    p_entity_type: "document",
    p_entity_id: data.id,
    p_entity_name: data.title || data.file_name || "item",
    p_details: {},
  });

  return NextResponse.json(data, { status: 201 });
}
