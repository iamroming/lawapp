-- =============================================
-- SECURITY HARDENING MIGRATION
-- Fixes multi-tenant isolation + employee restriction
-- Safe to re-run (idempotent)
-- =============================================

-- =============================================
-- 1. HELPER FUNCTIONS
-- =============================================

-- Fix is_admin(): admin -> owner
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND role = 'owner'
  );
$$;

-- Check if user is owner or partner (can see all firm data)
CREATE OR REPLACE FUNCTION public.is_firm_privileged(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND role IN ('owner', 'partner')
  );
$$;

-- =============================================
-- 2. ADD FIRM_ID TO ALL TABLES THAT NEED IT
-- =============================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'firm_id') THEN
    ALTER TABLE public.notifications ADD COLUMN firm_id uuid;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'firm_id') THEN
    ALTER TABLE public.messages ADD COLUMN firm_id uuid;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_portal_users' AND column_name = 'firm_id') THEN
    ALTER TABLE public.client_portal_users ADD COLUMN firm_id uuid;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tags' AND column_name = 'firm_id') THEN
    ALTER TABLE public.tags ADD COLUMN firm_id uuid;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reminders' AND column_name = 'firm_id') THEN
    ALTER TABLE public.reminders ADD COLUMN firm_id uuid;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scheduled_reminders' AND column_name = 'firm_id') THEN
    ALTER TABLE public.scheduled_reminders ADD COLUMN firm_id uuid;
  END IF;
END $$;

-- =============================================
-- 3. POPULATE FIRM_ID FROM PROFILES/CASES
-- =============================================

UPDATE public.notifications n
SET firm_id = p.firm_id
FROM public.profiles p
WHERE n.user_id = p.id AND n.firm_id IS NULL AND p.firm_id IS NOT NULL;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'sender_id') THEN
    UPDATE public.messages m
    SET firm_id = p.firm_id
    FROM public.profiles p
    WHERE m.sender_id = p.id AND m.firm_id IS NULL AND p.firm_id IS NOT NULL;
  END IF;
END $$;

UPDATE public.tags t
SET firm_id = p.firm_id
FROM public.profiles p
WHERE t.created_by = p.id AND t.firm_id IS NULL AND p.firm_id IS NOT NULL;

UPDATE public.reminders r
SET firm_id = p.firm_id
FROM public.profiles p
WHERE r.user_id = p.id AND r.firm_id IS NULL AND p.firm_id IS NOT NULL;

UPDATE public.scheduled_reminders sr
SET firm_id = p.firm_id
FROM public.profiles p
WHERE sr.user_id = p.id AND sr.firm_id IS NULL AND p.firm_id IS NOT NULL;

-- =============================================
-- 4. DROP OLD USER-CENTRIC RLS POLICIES
-- =============================================

DROP POLICY IF EXISTS "Users can view own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can insert own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can update own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can delete own cases" ON public.cases;

DROP POLICY IF EXISTS "Users can view own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON public.clients;

DROP POLICY IF EXISTS "Users can manage own case documents" ON public.documents;
DROP POLICY IF EXISTS "Users can manage own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can manage own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can manage own case hearings" ON public.hearings;
DROP POLICY IF EXISTS "Users can manage own case notes" ON public.notes;
DROP POLICY IF EXISTS "Users can manage own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Authenticated users can view tags" ON public.tags;
DROP POLICY IF EXISTS "Users can manage own case tags" ON public.case_tags;

-- =============================================
-- 5. ENABLE RLS ON UNPROTECTED TABLES
-- =============================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_portal_users ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. RESTRICTED RLS POLICIES
-- Owners/partners see ALL firm data
-- Employees see ONLY data they're involved in
-- =============================================

-- --- CASES ---
DROP POLICY IF EXISTS "cases_firm_isolation" ON public.cases;
CREATE POLICY "cases_firm_isolation" ON public.cases
  FOR ALL USING (
    firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
    AND (
      public.is_firm_privileged(auth.uid())
      OR created_by = auth.uid()
      OR assigned_to = auth.uid()
    )
  );

-- --- CLIENTS ---
DROP POLICY IF EXISTS "clients_firm_isolation" ON public.clients;
CREATE POLICY "clients_firm_isolation" ON public.clients
  FOR ALL USING (
    firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
    AND (
      public.is_firm_privileged(auth.uid())
      OR created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.cases
        WHERE cases.client_id = clients.id
        AND (cases.created_by = auth.uid() OR cases.assigned_to = auth.uid())
      )
    )
  );

-- --- DOCUMENTS ---
DROP POLICY IF EXISTS "documents_firm_isolation" ON public.documents;
CREATE POLICY "documents_firm_isolation" ON public.documents
  FOR ALL USING (
    firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
    AND (
      public.is_firm_privileged(auth.uid())
      OR uploaded_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.cases
        WHERE cases.id = documents.case_id
        AND (cases.created_by = auth.uid() OR cases.assigned_to = auth.uid())
      )
    )
  );

-- --- INVOICES ---
DROP POLICY IF EXISTS "invoices_firm_isolation" ON public.invoices;
CREATE POLICY "invoices_firm_isolation" ON public.invoices
  FOR ALL USING (
    firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
    AND (
      public.is_firm_privileged(auth.uid())
      OR issued_by = auth.uid()
    )
  );

-- --- PAYMENTS ---
DROP POLICY IF EXISTS "payments_firm_isolation" ON public.payments;
CREATE POLICY "payments_firm_isolation" ON public.payments
  FOR ALL USING (
    firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
    AND (
      public.is_firm_privileged(auth.uid())
      OR received_by = auth.uid()
    )
  );

-- --- HEARINGS ---
DROP POLICY IF EXISTS "hearings_firm_isolation" ON public.hearings;
CREATE POLICY "hearings_firm_isolation" ON public.hearings
  FOR ALL USING (
    firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
    AND (
      public.is_firm_privileged(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.cases
        WHERE cases.id = hearings.case_id
        AND (cases.created_by = auth.uid() OR cases.assigned_to = auth.uid())
      )
    )
  );

-- --- NOTES ---
DROP POLICY IF EXISTS "notes_firm_isolation" ON public.notes;
CREATE POLICY "notes_firm_isolation" ON public.notes
  FOR ALL USING (
    firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
    AND (
      public.is_firm_privileged(auth.uid())
      OR author_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.cases
        WHERE cases.id = notes.case_id
        AND (cases.created_by = auth.uid() OR cases.assigned_to = auth.uid())
      )
    )
  );

-- --- TIME_ENTRIES ---
DROP POLICY IF EXISTS "time_entries_firm_isolation" ON public.time_entries;
CREATE POLICY "time_entries_firm_isolation" ON public.time_entries
  FOR ALL USING (
    lawyer_id = auth.uid()
    OR public.is_firm_privileged(auth.uid())
  );

-- --- NOTIFICATIONS: user sees own ---
DROP POLICY IF EXISTS "notifications_firm_isolation" ON public.notifications;
CREATE POLICY "notifications_firm_isolation" ON public.notifications
  FOR ALL USING (
    user_id = auth.uid()
    OR firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
  );

-- --- MESSAGES: firm isolation ---
DROP POLICY IF EXISTS "messages_firm_isolation" ON public.messages;
CREATE POLICY "messages_firm_isolation" ON public.messages
  FOR ALL USING (
    firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
  );

-- --- CLIENT_PORTAL_USERS: firm isolation via client ---
DROP POLICY IF EXISTS "portal_users_firm_isolation" ON public.client_portal_users;
CREATE POLICY "portal_users_firm_isolation" ON public.client_portal_users
  FOR ALL USING (
    client_id IN (
      SELECT id FROM public.clients
      WHERE firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- --- TAGS: firm isolation ---
DROP POLICY IF EXISTS "Authenticated users can view tags" ON public.tags;
DROP POLICY IF EXISTS "Users can create tags" ON public.tags;
DROP POLICY IF EXISTS "tags_firm_isolation" ON public.tags;
CREATE POLICY "tags_firm_isolation" ON public.tags
  FOR ALL USING (
    firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
  );

-- --- CASE_TAGS: firm isolation via case ---
DROP POLICY IF EXISTS "Users can manage own case tags" ON public.case_tags;
DROP POLICY IF EXISTS "case_tags_firm_isolation" ON public.case_tags;
CREATE POLICY "case_tags_firm_isolation" ON public.case_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.cases
      WHERE cases.id = case_tags.case_id
      AND cases.firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
      AND (
        public.is_firm_privileged(auth.uid())
        OR cases.created_by = auth.uid()
        OR cases.assigned_to = auth.uid()
      )
    )
  );

-- --- CLIENT_TAG_ASSIGNMENTS: firm isolation via tag ---
DROP POLICY IF EXISTS "Users manage tag assignments" ON public.client_tag_assignments;
DROP POLICY IF EXISTS "tag_assignments_firm_isolation" ON public.client_tag_assignments;
CREATE POLICY "tag_assignments_firm_isolation" ON public.client_tag_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.client_tags ct
      WHERE ct.id = client_tag_assignments.tag_id
      AND ct.firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- --- CLIENT_FEEDBACK: firm isolation via client ---
DROP POLICY IF EXISTS "Users manage feedback" ON public.client_feedback;
DROP POLICY IF EXISTS "Clients can submit feedback" ON public.client_feedback;
DROP POLICY IF EXISTS "feedback_firm_isolation" ON public.client_feedback;
CREATE POLICY "feedback_firm_isolation" ON public.client_feedback
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = client_feedback.client_id
      AND clients.firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- --- REMINDERS: firm isolation ---
DROP POLICY IF EXISTS "Users can manage own reminders" ON public.reminders;
DROP POLICY IF EXISTS "reminders_firm_isolation" ON public.reminders;
CREATE POLICY "reminders_firm_isolation" ON public.reminders
  FOR ALL USING (
    user_id = auth.uid()
    OR firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
  );

-- --- WHATSAPP_LOGS: restrict open insert ---
DROP POLICY IF EXISTS "System can insert whatsapp logs" ON public.whatsapp_logs;
DROP POLICY IF EXISTS "whatsapp_logs_user_isolation" ON public.whatsapp_logs;
DROP POLICY IF EXISTS "whatsapp_logs_insert_auth" ON public.whatsapp_logs;
CREATE POLICY "whatsapp_logs_user_isolation" ON public.whatsapp_logs
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "whatsapp_logs_insert_auth" ON public.whatsapp_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- --- ECOURTS_CASES: firm isolation via case ---
DROP POLICY IF EXISTS "Users can manage ecourts cases for their cases" ON public.ecourts_cases;
DROP POLICY IF EXISTS "ecourts_cases_firm_isolation" ON public.ecourts_cases;
CREATE POLICY "ecourts_cases_firm_isolation" ON public.ecourts_cases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.cases
      WHERE cases.id = ecourts_cases.case_id
      AND cases.firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
      AND (
        public.is_firm_privileged(auth.uid())
        OR cases.created_by = auth.uid()
        OR cases.assigned_to = auth.uid()
      )
    )
  );

-- --- CAUSE_LIST_ENTRIES: firm isolation via case ---
DROP POLICY IF EXISTS "Users can view cause list entries for their cases" ON public.cause_list_entries;
DROP POLICY IF EXISTS "cause_list_entries_firm_isolation" ON public.cause_list_entries;
CREATE POLICY "cause_list_entries_firm_isolation" ON public.cause_list_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.cases
      WHERE cases.id = cause_list_entries.case_id
      AND cases.firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
      AND (
        public.is_firm_privileged(auth.uid())
        OR cases.created_by = auth.uid()
        OR cases.assigned_to = auth.uid()
      )
    )
  );

-- --- ECOURTS_ORDERS: firm isolation via case ---
DROP POLICY IF EXISTS "Users can view ecourts orders for their cases" ON public.ecourts_orders;
DROP POLICY IF EXISTS "ecourts_orders_firm_isolation" ON public.ecourts_orders;
CREATE POLICY "ecourts_orders_firm_isolation" ON public.ecourts_orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.cases
      WHERE cases.id = ecourts_orders.case_id
      AND cases.firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
      AND (
        public.is_firm_privileged(auth.uid())
        OR cases.created_by = auth.uid()
        OR cases.assigned_to = auth.uid()
      )
    )
  );

-- --- TRUST_ACCOUNTS: firm isolation via case ---
DROP POLICY IF EXISTS "Users can manage trust accounts for their cases" ON public.trust_accounts;
DROP POLICY IF EXISTS "trust_accounts_firm_isolation" ON public.trust_accounts;
CREATE POLICY "trust_accounts_firm_isolation" ON public.trust_accounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.cases
      WHERE cases.id = trust_accounts.case_id
      AND cases.firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
      AND (
        public.is_firm_privileged(auth.uid())
        OR cases.created_by = auth.uid()
        OR cases.assigned_to = auth.uid()
      )
    )
  );

-- --- TRUST_TRANSACTIONS: firm isolation via trust_account -> case ---
DROP POLICY IF EXISTS "Users can manage trust transactions for their accounts" ON public.trust_transactions;
DROP POLICY IF EXISTS "trust_transactions_firm_isolation" ON public.trust_transactions;
CREATE POLICY "trust_transactions_firm_isolation" ON public.trust_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.trust_accounts ta
      JOIN public.cases c ON c.id = ta.case_id
      WHERE ta.id = trust_transactions.trust_account_id
      AND c.firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
      AND (
        public.is_firm_privileged(auth.uid())
        OR c.created_by = auth.uid()
        OR c.assigned_to = auth.uid()
      )
    )
  );

-- --- TDS_RECORDS: firm isolation via client ---
DROP POLICY IF EXISTS "tds_records_firm_isolation" ON public.tds_records;
CREATE POLICY "tds_records_firm_isolation" ON public.tds_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = tds_records.client_id
      AND clients.firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- --- SCHEDULED_REMINDERS: firm isolation ---
DROP POLICY IF EXISTS "Users can manage own scheduled reminders" ON public.scheduled_reminders;
DROP POLICY IF EXISTS "scheduled_reminders_firm_isolation" ON public.scheduled_reminders;
CREATE POLICY "scheduled_reminders_firm_isolation" ON public.scheduled_reminders
  FOR ALL USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.cases
      WHERE cases.id = scheduled_reminders.case_id
      AND cases.firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
      AND (
        public.is_firm_privileged(auth.uid())
        OR cases.created_by = auth.uid()
        OR cases.assigned_to = auth.uid()
      )
    )
  );

-- --- COURT_CASE_LINKS: firm isolation via case ---
DROP POLICY IF EXISTS "Users can view own court links" ON public.court_case_links;
DROP POLICY IF EXISTS "Users can insert own court links" ON public.court_case_links;
DROP POLICY IF EXISTS "Users can update own court links" ON public.court_case_links;
DROP POLICY IF EXISTS "Users can delete own court links" ON public.court_case_links;
DROP POLICY IF EXISTS "court_case_links_firm_isolation" ON public.court_case_links;
CREATE POLICY "court_case_links_firm_isolation" ON public.court_case_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.cases
      WHERE cases.id = court_case_links.case_id
      AND cases.firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
      AND (
        public.is_firm_privileged(auth.uid())
        OR cases.created_by = auth.uid()
        OR cases.assigned_to = auth.uid()
      )
    )
  );

-- --- COURT_ORDERS: firm isolation via case ---
DROP POLICY IF EXISTS "Users can view orders for own cases" ON public.court_orders;
DROP POLICY IF EXISTS "Users can insert orders for own cases" ON public.court_orders;
DROP POLICY IF EXISTS "court_orders_firm_isolation" ON public.court_orders;
CREATE POLICY "court_orders_firm_isolation" ON public.court_orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.cases
      WHERE cases.id = court_orders.case_id
      AND cases.firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
      AND (
        public.is_firm_privileged(auth.uid())
        OR cases.created_by = auth.uid()
        OR cases.assigned_to = auth.uid()
      )
    )
  );

-- --- COURT_CAUSE_LISTS: authenticated only ---
DROP POLICY IF EXISTS "Anyone can view cause lists" ON public.court_cause_lists;
DROP POLICY IF EXISTS "System can insert cause lists" ON public.court_cause_lists;
DROP POLICY IF EXISTS "court_cause_lists_auth" ON public.court_cause_lists;
CREATE POLICY "court_cause_lists_auth" ON public.court_cause_lists
  FOR ALL USING (auth.role() = 'authenticated');

-- --- PROFILES: firm owner/partners can see team ---
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_firm_isolation" ON public.profiles;
CREATE POLICY "profiles_firm_isolation" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
  );

-- =============================================
-- 7. FIX TEAM_INVITES REDEMPTION
-- =============================================
DROP POLICY IF EXISTS "Anyone can redeem valid invite" ON public.team_invites;
DROP POLICY IF EXISTS "team_invites_redeem_firm" ON public.team_invites;
CREATE POLICY "team_invites_redeem_firm" ON public.team_invites
  FOR UPDATE USING (
    is_active = true
    AND used_by IS NULL
    AND firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
  );

-- =============================================
-- 8. ADD INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_tags_firm_id ON public.tags(firm_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_firm_id ON public.messages(firm_id);

-- =============================================
-- DONE
-- =============================================
