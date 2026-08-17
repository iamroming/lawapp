const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const statements = [
  `CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL DEFAULT 'pageview',
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_hash TEXT,
    country TEXT,
    city TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    session_id TEXT NOT NULL,
    user_id UUID,
    duration_ms INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events (created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics_events (session_id)`,
  `CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events (event_type)`,
  `CREATE INDEX IF NOT EXISTS idx_analytics_page_url ON analytics_events (page_url)`,
  `CREATE INDEX IF NOT EXISTS idx_analytics_referrer ON analytics_events (referrer)`,
  `CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events (user_id)`,
];

(async () => {
  for (const sql of statements) {
    const { error } = await sb.rpc('exec_sql', { query: sql });
    if (error && error.message.includes('function "exec_sql" does not exist')) {
      console.log('NEED_MANUAL: exec_sql RPC not found.');
      console.log('Please run supabase/analytics-table.sql in Supabase SQL Editor.');
      process.exit(1);
    }
    if (error) console.log('Warning:', error.message);
  }
  console.log('Analytics table created successfully');
})();
