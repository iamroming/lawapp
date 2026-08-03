-- AI usage tracking for per-plan quota enforcement
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_created ON ai_usage(user_id, created_at);

-- RLS: users can only see their own usage
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI usage" ON ai_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert AI usage" ON ai_usage
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
