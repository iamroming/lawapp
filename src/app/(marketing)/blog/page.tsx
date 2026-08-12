import { Metadata } from "next";
import Link from "next/link";
import { Scale, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog - CaseFiles",
  description: "Legal practice management insights, tips, and updates for Indian lawyers.",
};

async function getPosts() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.casefiles.in";
  try {
    const res = await fetch(`${baseUrl}/api/blog`, { cache: "no-store" });
    const data = await res.json();
    return data.posts || [];
  } catch {
    return [];
  }
}

export default async function BlogListPage() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Blog</h1>
          <p className="mt-3 text-lg text-gray-500">
            Insights, tips, and updates for Indian legal professionals
          </p>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No blog posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post: any) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                <article className="h-full flex flex-col">
                  {post.cover_image && (
                    <div className="aspect-video rounded-xl overflow-hidden mb-4 bg-gray-100">
                      <img
                        src={post.cover_image}
                        alt={post.heading}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  {!post.cover_image && (
                    <div className="aspect-video rounded-xl mb-4 bg-gradient-to-br from-orange-500/10 to-indigo-500/10 flex items-center justify-center">
                      <Scale className="h-10 w-10 text-orange-500/40" />
                    </div>
                  )}
                  <h2 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2">
                    {post.heading}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-2 text-sm text-gray-500 line-clamp-3 flex-1">{post.excerpt}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                    <span>{post.author_name}</span>
                    {post.published_at && (
                      <span>
                        {new Date(post.published_at).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                  <span className="mt-3 text-sm font-semibold text-orange-600 flex items-center gap-1">
                    Read more <ArrowRight className="h-3 w-3" />
                  </span>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
