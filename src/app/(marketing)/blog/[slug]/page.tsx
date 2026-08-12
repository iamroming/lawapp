import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Scale, Calendar, User, ArrowLeft } from "lucide-react";

async function getPost(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.casefiles.in";
  try {
    const res = await fetch(`${baseUrl}/api/blog?slug=${slug}`, { cache: "no-store" });
    const data = await res.json();
    return data.post || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: post.meta_title || post.heading,
    description: post.meta_description || post.excerpt,
    openGraph: {
      title: post.meta_title || post.heading,
      description: post.meta_description || post.excerpt,
      images: post.cover_image ? [post.cover_image] : [],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            {post.heading}
          </h1>
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {post.author_name}
            </span>
            {post.published_at && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(post.published_at).toLocaleDateString("en-IN", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Cover Image */}
      {post.cover_image && (
        <div className="max-w-4xl mx-auto px-4 -mt-2 mb-8">
          <img
            src={post.cover_image}
            alt={post.heading}
            className="w-full rounded-2xl shadow-lg object-cover max-h-[500px]"
          />
        </div>
      )}

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <article
          className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-orange-600 prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>

      {/* Footer */}
      <div className="max-w-3xl mx-auto px-4 py-8 border-t border-gray-200">
        <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-semibold">
          <ArrowLeft className="h-4 w-4" /> More articles
        </Link>
      </div>
    </div>
  );
}
