import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: post, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({ post });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await request.json();
  const { title, heading, cover_image, content, excerpt, status, author_name, meta_title, meta_description } = body;

  const updates: Record<string, any> = {
    title,
    heading,
    cover_image: cover_image || null,
    content,
    excerpt: excerpt || content?.replace(/<[^>]+>/g, "").slice(0, 200),
    status,
    author_name: author_name || "CaseFiles Team",
    meta_title: meta_title || title,
    meta_description: meta_description || excerpt,
    updated_at: new Date().toISOString(),
  };

  if (title) {
    const { data: existing } = await supabase.from("blog_posts").select("slug").eq("id", id).single();
    if (existing && title !== existing.slug) {
      updates.slug = slugify(title);
    }
  }

  if (status === "published") {
    const { data: current } = await supabase.from("blog_posts").select("published_at").eq("id", id).single();
    if (!current?.published_at) {
      updates.published_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.from("blog_posts").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
