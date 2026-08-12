import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (slug) {
    const { data: post, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, heading, cover_image, content, excerpt, author_name, published_at")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  }

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, title, slug, heading, cover_image, excerpt, author_name, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return NextResponse.json({ posts: posts || [] });
}
