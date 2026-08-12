-- Court data integration tables for CaseFiles
-- Run this in Supabase SQL Editor

-- Link cases to eCourts
CREATE TABLE IF NOT EXISTS court_case_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  court_code TEXT NOT NULL,
  case_type_code TEXT,
  case_number TEXT,
  year TEXT,
  cnr_number TEXT,
  bench_code TEXT DEFAULT '1',
  last_checked TIMESTAMPTZ,
  last_order_date DATE,
  auto_fetch BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store fetched court orders
CREATE TABLE IF NOT EXISTS court_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  court_code TEXT NOT NULL,
  order_date DATE,
  order_type TEXT,
  judge TEXT,
  pdf_url TEXT,
  pdf_storage_path TEXT,
  downloaded BOOLEAN DEFAULT false,
  notified BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store cause list entries
CREATE TABLE IF NOT EXISTS court_cause_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  court_code TEXT NOT NULL,
  listing_date DATE NOT NULL,
  serial_number INTEGER,
  case_number TEXT,
  case_type TEXT,
  petitioner TEXT,
  respondent TEXT,
  advocate_petitioner TEXT,
  advocate_respondent TEXT,
  court_number TEXT,
  judge TEXT,
  bench TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_court_case_links_case_id ON court_case_links(case_id);
CREATE INDEX IF NOT EXISTS idx_court_case_links_user_id ON court_case_links(user_id);
CREATE INDEX IF NOT EXISTS idx_court_case_links_cnr ON court_case_links(cnr_number);
CREATE INDEX IF NOT EXISTS idx_court_orders_case_id ON court_orders(case_id);
CREATE INDEX IF NOT EXISTS idx_court_orders_date ON court_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_court_cause_lists_date ON court_cause_lists(listing_date);
CREATE INDEX IF NOT EXISTS idx_court_cause_lists_court ON court_cause_lists(court_code);

-- RLS policies
ALTER TABLE court_case_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_cause_lists ENABLE ROW LEVEL SECURITY;

-- Users can view their own linked cases
DROP POLICY IF EXISTS "Users can view own court links" ON court_case_links;
CREATE POLICY "Users can view own court links" ON court_case_links
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own court links
DROP POLICY IF EXISTS "Users can insert own court links" ON court_case_links;
CREATE POLICY "Users can insert own court links" ON court_case_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own court links
DROP POLICY IF EXISTS "Users can update own court links" ON court_case_links;
CREATE POLICY "Users can update own court links" ON court_case_links
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own court links
DROP POLICY IF EXISTS "Users can delete own court links" ON court_case_links;
CREATE POLICY "Users can delete own court links" ON court_case_links
  FOR DELETE USING (auth.uid() = user_id);

-- Users can view orders for their cases
DROP POLICY IF EXISTS "Users can view orders for own cases" ON court_orders;
CREATE POLICY "Users can view orders for own cases" ON court_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM court_case_links
      WHERE court_case_links.case_id = court_orders.case_id
      AND court_case_links.user_id = auth.uid()
    )
  );

-- Users can insert orders for their cases
DROP POLICY IF EXISTS "Users can insert orders for own cases" ON court_orders;
CREATE POLICY "Users can insert orders for own cases" ON court_orders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM court_case_links
      WHERE court_case_links.case_id = court_orders.case_id
      AND court_case_links.user_id = auth.uid()
    )
  );

-- Everyone can view cause lists (public data)
DROP POLICY IF EXISTS "Anyone can view cause lists" ON court_cause_lists;
CREATE POLICY "Anyone can view cause lists" ON court_cause_lists
  FOR SELECT USING (true);

-- System can insert cause lists
DROP POLICY IF EXISTS "System can insert cause lists" ON court_cause_lists;
CREATE POLICY "System can insert cause lists" ON court_cause_lists
  FOR INSERT WITH CHECK (true);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_court_case_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_court_case_links_updated_at ON court_case_links;
CREATE TRIGGER trigger_update_court_case_links_updated_at
  BEFORE UPDATE ON court_case_links
  FOR EACH ROW
  EXECUTE FUNCTION update_court_case_links_updated_at();
