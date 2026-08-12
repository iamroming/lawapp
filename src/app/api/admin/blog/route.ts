import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "published";

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", status)
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false });

  return NextResponse.json({ posts: posts || [] });
}

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await request.json();
  const { title, heading, cover_image, content, excerpt, status, author_name, meta_title, meta_description } = body;

  if (!title || !heading || !content) {
    return NextResponse.json({ error: "Title, heading, and content are required" }, { status: 400 });
  }

  let slug = slugify(title);
  const { data: existing } = await supabase.from("blog_posts").select("id").eq("slug", slug).single();
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      title,
      slug,
      heading,
      cover_image: cover_image || null,
      content,
      excerpt: excerpt || content.replace(/<[^>]+>/g, "").slice(0, 200),
      status: status || "draft",
      author_name: author_name || "CaseFiles Team",
      meta_title: meta_title || title,
      meta_description: meta_description || excerpt,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post: data });
}
