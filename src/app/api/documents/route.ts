import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { checkStorageLimit } from "@/lib/subscription-limits";
import { getCloudinaryPublicId } from "@/lib/cloudinary";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get("case_id");

  const { data: profile } = await supabase.from("profiles").select("firm_id, role").eq("id", user.uuid).single();
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
      .eq("firm_id", firmId)
      .or(`created_by.eq.${user.uuid},assigned_to.eq.${user.uuid}`);
    const caseIds = (assignedCases || []).map((c) => c.id);
    if (caseIds.length > 0) {
      query = query.or(`uploaded_by.eq.${user.uuid},case_id.in.(${caseIds.join(",")})`);
    } else {
      query = query.eq("uploaded_by", user.uuid);
    }  }

  if (caseId) query = query.eq("case_id", caseId);

  const { data, error } = await query;
  if (error) {
    console.error("Failed to fetch documents:", error.message);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }

  const docs = (data || []).map((d: any) => ({
    ...d,
    case: Array.isArray(d.case) ? d.case[0] : d.case,
    uploader: Array.isArray(d.uploader) ? d.uploader[0] : d.uploader,
  }));
  return NextResponse.json(docs);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
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

  // Validate file type against allowlist
  const ALLOWED_FILE_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpeg",
    "image/png",
    "image/gif",
  ];
  if (allowedFields.file_type && !ALLOWED_FILE_TYPES.includes(allowedFields.file_type)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  // Role check: owner/partner/senior_associate/associate/junior_associate/paralegal can upload docs
  const { data: roleProfile } = await supabase.from("profiles").select("firm_id, role").eq("id", user.uuid).single();
  const docCreateRoles = ["owner", "partner", "senior_associate", "associate", "junior_associate", "paralegal", "super_admin"];
  if (!roleProfile?.role || !docCreateRoles.includes(roleProfile.role)) {
    return NextResponse.json({ error: "Forbidden: you do not have permission to upload documents" }, { status: 403 });
  }

  const storageProfile = roleProfile;

  const storageFirmId = storageProfile?.firm_id || user.uuid;

  // Check storage limit (existing usage + new file)
  const fileSize = allowedFields.file_size || 0;
  if (fileSize > 0) {
    const { data: existingDocs } = await supabase
      .from("documents")
      .select("file_size")
      .eq("firm_id", storageFirmId)
      .is("deleted_at", null);

    const existingBytes = (existingDocs || []).reduce(
      (sum: number, doc: { file_size: number | null }) => sum + (doc.file_size || 0),
      0
    );
    const totalBytes = existingBytes + fileSize;

    const storageCheck = await checkStorageLimit(storageFirmId, totalBytes);
    if (!storageCheck.allowed) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.uuid).single();
      const isOwnerOrPartner = ["owner", "partner"].includes(profile?.role || "");
      const message = isOwnerOrPartner
        ? `You've reached your ${storageCheck.plan} plan storage limit of ${storageCheck.limit} MB. Upgrade your plan for more storage.`
        : `Your firm has reached the ${storageCheck.plan} plan storage limit of ${storageCheck.limit} MB. Contact the firm owner to upgrade.`;
      // Clean up the already-uploaded Cloudinary file
      if (allowedFields.file_url) {
        const publicId = getCloudinaryPublicId(allowedFields.file_url);
        if (publicId) {
          try {
            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
            const apiKey = process.env.CLOUDINARY_API_KEY;
            const apiSecret = process.env.CLOUDINARY_API_SECRET;
            if (cloudName && apiKey && apiSecret) {
              const timestamp = Math.round(Date.now() / 1000);
              const signature = crypto
                .createHash("sha1")
                .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
                .digest("hex");
              const formData = new FormData();
              formData.append("public_id", publicId);
              formData.append("timestamp", timestamp.toString());
              formData.append("api_key", apiKey);
              formData.append("signature", signature);
              const ext = publicId.split(".").pop()?.toLowerCase() || "";
              let resourceType = "image";
              if (ext === "pdf") resourceType = "raw";
              else if (["doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"].includes(ext)) resourceType = "raw";
              await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
                { method: "POST", body: formData }
              );
            }
          } catch {
            // Best-effort cleanup — don't fail the request
          }
        }
      }
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (storageCheck.message) {
      // 80% warning — still allowed, but log it
      console.warn("Storage warning:", storageCheck.message);
    }
  }

  // Get firm_id for the document
  const firmId = storageProfile?.firm_id || user.uuid;

  // If case_id provided, verify it belongs to the firm and is not deleted
  if (allowedFields.case_id) {
    const { data: caseRow } = await supabase.from("cases").select("id").eq("id", allowedFields.case_id).eq("firm_id", firmId).is("deleted_at", null).single();
    if (!caseRow) return NextResponse.json({ error: "Case not found in your firm" }, { status: 404 });
  }

  const filteredBody = Object.fromEntries(
    Object.entries(allowedFields).filter(([, v]) => v !== undefined)
  );
  const { data, error } = await supabase
    .from("documents")
    .insert({ ...filteredBody, uploaded_by: user.uuid, firm_id: firmId })
    .select()
    .single();
  if (error) {
    console.error("Failed to create document:", error.message);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }

  await supabase.rpc("log_activity", {
    p_user_id: user.uuid,
    p_action: "created",
    p_entity_type: "document",
    p_entity_id: data.id,
    p_entity_name: data.title || data.file_name || "item",
    p_details: {},
  });

  return NextResponse.json(data, { status: 201 });
}
