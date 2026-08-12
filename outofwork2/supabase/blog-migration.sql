-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  heading TEXT NOT NULL,
  cover_image TEXT,
  content TEXT NOT NULL,
  excerpt TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  author_name TEXT DEFAULT 'CaseFiles Team',
  meta_title TEXT,
  meta_description TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for public listing (published posts)
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts (status, published_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts (slug);

-- RLS disabled (auth handled at API level)
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;
