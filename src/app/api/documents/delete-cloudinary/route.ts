import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifySessionFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { publicId } = body;

  if (!publicId) {
    return NextResponse.json({ error: "publicId is required" }, { status: 400 });
  }

  // Verify the file belongs to a document in the user's firm
  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.uuid)
    .single();
  const firmId = profile?.firm_id || user.uuid;

  // Check if any document in the firm has this publicId in its file_name or file_url
  const { data: docs } = await supabase
    .from("documents")
    .select("id, file_name, file_url, file_path")
    .eq("firm_id", firmId)
    .is("deleted_at", null);

  const doc = docs?.find((d) => {
    // Extract the public_id part from file_url (Cloudinary URLs end with the public_id)
    const urlParts = (d.file_url || "").split("/");
    const urlPublicId = urlParts.slice(urlParts.indexOf("upload") + 1).join("/").replace(/\.[^.]+$/, "");
    return (
      d.file_name === publicId ||
      d.file_path === publicId ||
      urlPublicId === publicId
    );
  });

  if (!doc) {
    return NextResponse.json({ error: "File not found in your firm" }, { status: 404 });
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500 });
  }

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

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
    { method: "POST", body: formData }
  );

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json({ error: data.error?.message || "Delete failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
