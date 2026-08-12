import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import crypto from "crypto";

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "";
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "";

function generateCloudinarySignedUrl(publicId: string, expiresIn: number = 300): string {
  const timestamp = Math.floor(Date.now() / 1000) + expiresIn;
  const toSign = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload?public_id=${publicId}&timestamp=${timestamp}&api_key=${CLOUDINARY_API_KEY}&signature=${signature}`;
}

function extractCloudinaryPublicId(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
  return match ? match[1] : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.uuid)
    .single();
  const firmId = profile?.firm_id;

  const { data: doc, error } = await supabase
    .from("documents")
    .select("id, file_url, is_confidential, uploaded_by, case_id")
    .eq("id", id)
    .eq("firm_id", firmId)
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Verify user has access (owner or case owner/assignee)
  const hasAccess = doc.uploaded_by === user.uuid;
  if (!hasAccess && doc.case_id) {
    const { data: caseData } = await supabase
      .from("cases")
      .select("created_by, assigned_to, firm_id")
      .eq("id", doc.case_id)
      .single();

    if (
      !caseData ||
      caseData.firm_id !== firmId ||
      (caseData.created_by !== user.uuid && caseData.assigned_to !== user.uuid)
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  } else if (!hasAccess && !doc.case_id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const publicId = extractCloudinaryPublicId(doc.file_url);
  if (!publicId) {
    // Fallback: return the original URL if we can't extract public ID
    return NextResponse.json({ url: doc.file_url });
  }

  // Confidential documents get short-lived signed URLs (5 min)
  // Non-confidential get longer URLs (1 hour)
  const expiresIn = doc.is_confidential ? 300 : 3600;
  const signedUrl = generateCloudinarySignedUrl(publicId, expiresIn);

  return NextResponse.json({ url: signedUrl, expiresIn });
}
