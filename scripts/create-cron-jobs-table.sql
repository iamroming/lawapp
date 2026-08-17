-- ============================================
-- CRON JOBS MANAGEMENT TABLE
-- Run this in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS cron_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic info
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- Endpoint config
  endpoint TEXT NOT NULL,
  method TEXT DEFAULT 'GET' CHECK (method IN ('GET', 'POST')),
  
  -- Schedule
  schedule_cron TEXT NOT NULL DEFAULT '0 9 * * *',
  timezone TEXT DEFAULT 'UTC',
  
  -- Status
  is_enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  last_status TEXT CHECK (last_status IN ('success', 'failed', 'running')),
  last_error TEXT,
  last_duration_ms INTEGER,
  
  -- Stats
  total_runs INTEGER DEFAULT 0,
  total_successes INTEGER DEFAULT 0,
  total_failures INTEGER DEFAULT 0,
  
  -- Actions config (JSON)
  actions JSONB DEFAULT '{
    "email": false,
    "whatsapp": false,
    "in_app": false,
    "database": true
  }'::jsonb,
  
  -- Custom config
  config JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_cron_jobs_slug ON cron_jobs(slug);
CREATE INDEX IF NOT EXISTS idx_cron_jobs_enabled ON cron_jobs(is_enabled);

-- ============================================
-- SEED DEFAULT CRON JOBS
-- ============================================

INSERT INTO cron_jobs (name, slug, description, endpoint, schedule_cron, actions) VALUES
(
  'Trial Funnel',
  'trial-funnel',
  'Sends trial reminder emails and WhatsApp messages to users on day 0, 3, 7, 12, 14',
  '/api/subscriptions/trial-funnel',
  '0 9 * * *',
  '{"email": true, "whatsapp": true, "in_app": false, "database": true}'::jsonb
),
(
  'Hearing Reminders',
  'hearing-reminders',
  'Sends WhatsApp reminders to lawyers and firm owners for tomorrow''s hearings',
  '/api/reminders/cron',
  '0 18 * * *',
  '{"email": false, "whatsapp": true, "in_app": false, "database": true}'::jsonb
),
(
  'Expire Trials',
  'expire-trials',
  'Marks expired trials as expired and restricts user access',
  '/api/subscriptions/expire-trials',
  '0 8 * * *',
  '{"email": false, "whatsapp": false, "in_app": false, "database": true}'::jsonb
),
(
  'Daily Digest',
  'daily-digest',
  'Sends daily digest email with today''s hearings, tasks, and overdue invoices',
  '/api/daily-digest',
  '30 2 * * *',
  '{"email": true, "whatsapp": false, "in_app": false, "database": false}'::jsonb
),
(
  'Invoice Reminders',
  'invoice-reminders',
  'Sends payment reminder emails for overdue invoices (7/30/60 days)',
  '/api/invoices/reminders',
  '0 10 * * *',
  '{"email": true, "whatsapp": false, "in_app": false, "database": true}'::jsonb
),
(
  'Deadline Check',
  'deadline-check',
  'Checks case limitation dates and creates deadline reminders',
  '/api/deadlines/check',
  '0 7 * * *',
  '{"email": true, "whatsapp": true, "in_app": false, "database": true}'::jsonb
),
(
  'Cause List Sync',
  'cause-list-sync',
  'Syncs cause list entries from cases to cause_list_entries table',
  '/api/cause-list/sync',
  '0 5 * * *',
  '{"email": false, "whatsapp": false, "in_app": false, "database": true}'::jsonb
),
(
  'Case Alerts Check',
  'case-alerts',
  'Checks eCourts for case status/hearing changes and sends notifications',
  '/api/case-alerts/check',
  '0 11 * * *',
  '{"email": true, "whatsapp": true, "in_app": true, "database": true}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- FUNCTION: Update updated_at on changes
-- ============================================

CREATE OR REPLACE FUNCTION update_cron_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cron_jobs_updated_at ON cron_jobs;
CREATE TRIGGER cron_jobs_updated_at
  BEFORE UPDATE ON cron_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_cron_jobs_updated_at();

-- ============================================
-- FUNCTION: Log cron job run
-- ============================================

CREATE OR REPLACE FUNCTION log_cron_run(
  p_slug TEXT,
  p_status TEXT,
  p_duration_ms INTEGER DEFAULT NULL,
  p_error TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE cron_jobs SET
    last_run_at = NOW(),
    last_status = p_status,
    last_error = p_error,
    last_duration_ms = p_duration_ms,
    total_runs = total_runs + 1,
    total_successes = CASE WHEN p_status = 'success' THEN total_successes + 1 ELSE total_successes END,
    total_failures = CASE WHEN p_status = 'failed' THEN total_failures + 1 ELSE total_failures END
  WHERE slug = p_slug;
END;
$$ LANGUAGE plpgsql;
