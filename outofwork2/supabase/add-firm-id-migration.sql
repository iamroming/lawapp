-- =============================================
-- ADD FIRM_ID TO ALL TABLES MIGRATION
-- Run this AFTER the complete-schema.sql and lawfirm-roles-migration.sql
-- This adds firm_id to all main tables for better tenant isolation
-- =============================================

-- =============================================
-- 1. ADD FIRM_ID COLUMNS
-- =============================================

-- Cases table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'firm_id') THEN
    ALTER TABLE public.cases ADD COLUMN firm_id uuid references public.profiles(id);
  END IF;
END $$;

-- Clients table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'firm_id') THEN
    ALTER TABLE public.clients ADD COLUMN firm_id uuid references public.profiles(id);
  END IF;
END $$;

-- Documents table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'firm_id') THEN
    ALTER TABLE public.documents ADD COLUMN firm_id uuid references public.profiles(id);
  END IF;
END $$;

-- Payments table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'firm_id') THEN
    ALTER TABLE public.payments ADD COLUMN firm_id uuid references public.profiles(id);
  END IF;
END $$;

-- Invoices table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'firm_id') THEN
    ALTER TABLE public.invoices ADD COLUMN firm_id uuid references public.profiles(id);
  END IF;
END $$;

-- Hearings table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hearings' AND column_name = 'firm_id') THEN
    ALTER TABLE public.hearings ADD COLUMN firm_id uuid references public.profiles(id);
  END IF;
END $$;

-- Messages table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'firm_id') THEN
    ALTER TABLE public.messages ADD COLUMN firm_id uuid references public.profiles(id);
  END IF;
END $$;

-- Scheduled Reminders table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scheduled_reminders') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scheduled_reminders' AND column_name = 'firm_id') THEN
      ALTER TABLE public.scheduled_reminders ADD COLUMN firm_id uuid references public.profiles(id);
    END IF;
  END IF;
END $$;

-- Notifications table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'firm_id') THEN
    ALTER TABLE public.notifications ADD COLUMN firm_id uuid references public.profiles(id);
  END IF;
END $$;

-- Notes table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'firm_id') THEN
    ALTER TABLE public.notes ADD COLUMN firm_id uuid references public.profiles(id);
  END IF;
END $$;

-- =============================================
-- 2. POPULATE FIRM_ID FROM PROFILES
-- =============================================

-- Cases: set firm_id from created_by profile
UPDATE public.cases c
SET firm_id = p.firm_id
FROM public.profiles p
WHERE c.created_by = p.id AND c.firm_id IS NULL;

-- Clients: set firm_id from created_by profile
UPDATE public.clients c
SET firm_id = p.firm_id
FROM public.profiles p
WHERE c.created_by = p.id AND c.firm_id IS NULL;

-- Documents: set firm_id from uploaded_by profile
UPDATE public.documents d
SET firm_id = p.firm_id
FROM public.profiles p
WHERE d.uploaded_by = p.id AND d.firm_id IS NULL;

-- Payments: set firm_id from received_by profile
UPDATE public.payments pmt
SET firm_id = p.firm_id
FROM public.profiles p
WHERE pmt.received_by = p.id AND pmt.firm_id IS NULL;

-- Invoices: set firm_id from issued_by profile
UPDATE public.invoices i
SET firm_id = p.firm_id
FROM public.profiles p
WHERE i.issued_by = p.id AND i.firm_id IS NULL;

-- Hearings: set firm_id from cases
UPDATE public.hearings h
SET firm_id = c.firm_id
FROM public.cases c
WHERE h.case_id = c.id AND h.firm_id IS NULL;

-- Messages: set firm_id from sender profile
UPDATE public.messages m
SET firm_id = p.firm_id
FROM public.profiles p
WHERE m.sender_id = p.id AND m.firm_id IS NULL;

-- Notifications: set firm_id from user profile
UPDATE public.notifications n
SET firm_id = p.firm_id
FROM public.profiles p
WHERE n.user_id = p.id AND n.firm_id IS NULL;

-- Notes: set firm_id from author profile
UPDATE public.notes n
SET firm_id = p.firm_id
FROM public.profiles p
WHERE n.author_id = p.id AND n.firm_id IS NULL;

-- =============================================
-- 3. SET FIRM_ID NOT NULL (after populating)
-- =============================================

-- Only set NOT NULL if all rows have firm_id populated
DO $$
DECLARE
  null_count bigint;
BEGIN
  SELECT COUNT(*) INTO null_count FROM public.cases WHERE firm_id IS NULL;
  IF null_count = 0 THEN
    ALTER TABLE public.cases ALTER COLUMN firm_id SET NOT NULL;
  END IF;
END $$;

DO $$
DECLARE
  null_count bigint;
BEGIN
  SELECT COUNT(*) INTO null_count FROM public.clients WHERE firm_id IS NULL;
  IF null_count = 0 THEN
    ALTER TABLE public.clients ALTER COLUMN firm_id SET NOT NULL;
  END IF;
END $$;

DO $$
DECLARE
  null_count bigint;
BEGIN
  SELECT COUNT(*) INTO null_count FROM public.documents WHERE firm_id IS NULL;
  IF null_count = 0 THEN
    ALTER TABLE public.documents ALTER COLUMN firm_id SET NOT NULL;
  END IF;
END $$;

DO $$
DECLARE
  null_count bigint;
BEGIN
  SELECT COUNT(*) INTO null_count FROM public.payments WHERE firm_id IS NULL;
  IF null_count = 0 THEN
    ALTER TABLE public.payments ALTER COLUMN firm_id SET NOT NULL;
  END IF;
END $$;

DO $$
DECLARE
  null_count bigint;
BEGIN
  SELECT COUNT(*) INTO null_count FROM public.invoices WHERE firm_id IS NULL;
  IF null_count = 0 THEN
    ALTER TABLE public.invoices ALTER COLUMN firm_id SET NOT NULL;
  END IF;
END $$;

DO $$
DECLARE
  null_count bigint;
BEGIN
  SELECT COUNT(*) INTO null_count FROM public.hearings WHERE firm_id IS NULL;
  IF null_count = 0 THEN
    ALTER TABLE public.hearings ALTER COLUMN firm_id SET NOT NULL;
  END IF;
END $$;

-- =============================================
-- 4. ADD INDEXES FOR FIRM_ID
-- =============================================

CREATE INDEX IF NOT EXISTS idx_cases_firm_id ON public.cases(firm_id);
CREATE INDEX IF NOT EXISTS idx_clients_firm_id ON public.clients(firm_id);
CREATE INDEX IF NOT EXISTS idx_documents_firm_id ON public.documents(firm_id);
CREATE INDEX IF NOT EXISTS idx_payments_firm_id ON public.payments(firm_id);
CREATE INDEX IF NOT EXISTS idx_invoices_firm_id ON public.invoices(firm_id);
CREATE INDEX IF NOT EXISTS idx_hearings_firm_id ON public.hearings(firm_id);
CREATE INDEX IF NOT EXISTS idx_messages_firm_id ON public.messages(firm_id);
CREATE INDEX IF NOT EXISTS idx_notifications_firm_id ON public.notifications(firm_id);
CREATE INDEX IF NOT EXISTS idx_notes_firm_id ON public.notes(firm_id);

-- =============================================
-- 5. UPDATE RLS POLICIES WITH FIRM_ID
-- =============================================

-- Cases: Users see only their firm's cases
DROP POLICY IF EXISTS "cases_firm_isolation" ON public.cases;
CREATE POLICY "cases_firm_isolation" ON public.cases
  FOR ALL USING (
    firm_id = (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Clients: Users see only their firm's clients
DROP POLICY IF EXISTS "clients_firm_isolation" ON public.clients;
CREATE POLICY "clients_firm_isolation" ON public.clients
  FOR ALL USING (
    firm_id = (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Documents: Users see only their firm's documents
DROP POLICY IF EXISTS "documents_firm_isolation" ON public.documents;
CREATE POLICY "documents_firm_isolation" ON public.documents
  FOR ALL USING (
    firm_id = (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Payments: Users see only their firm's payments
DROP POLICY IF EXISTS "payments_firm_isolation" ON public.payments;
CREATE POLICY "payments_firm_isolation" ON public.payments
  FOR ALL USING (
    firm_id = (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Invoices: Users see only their firm's invoices
DROP POLICY IF EXISTS "invoices_firm_isolation" ON public.invoices;
CREATE POLICY "invoices_firm_isolation" ON public.invoices
  FOR ALL USING (
    firm_id = (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Hearings: Users see only their firm's hearings
DROP POLICY IF EXISTS "hearings_firm_isolation" ON public.hearings;
CREATE POLICY "hearings_firm_isolation" ON public.hearings
  FOR ALL USING (
    firm_id = (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Messages: Users see only their firm's messages
DROP POLICY IF EXISTS "messages_firm_isolation" ON public.messages;
CREATE POLICY "messages_firm_isolation" ON public.messages
  FOR ALL USING (
    firm_id = (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Notifications: Users see only their firm's notifications
DROP POLICY IF EXISTS "notifications_firm_isolation" ON public.notifications;
CREATE POLICY "notifications_firm_isolation" ON public.notifications
  FOR ALL USING (
    firm_id = (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Notes: Users see only their firm's notes
DROP POLICY IF EXISTS "notes_firm_isolation" ON public.notes;
CREATE POLICY "notes_firm_isolation" ON public.notes
  FOR ALL USING (
    firm_id = (
      SELECT firm_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- =============================================
-- 6. CREATE NOTIFICATION LOGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  reminder_id uuid,
  channel text not null check (channel in ('email', 'sms', 'whatsapp', 'in_app', 'push')),
  status text default 'sent' check (status in ('sent', 'failed', 'pending')),
  error_message text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_logs_select" ON public.notification_logs;
CREATE POLICY "notification_logs_select" ON public.notification_logs
  FOR SELECT USING (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "notification_logs_insert" ON public.notification_logs;
CREATE POLICY "notification_logs_insert" ON public.notification_logs
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON public.notification_logs(created_at);

-- =============================================
-- 7. UPDATE TRIGGERS FOR FIRM_ID
-- =============================================

-- Function to auto-set firm_id from creator's profile
CREATE OR REPLACE FUNCTION public.set_firm_id_from_creator()
RETURNS trigger AS $$
BEGIN
  IF NEW.firm_id IS NULL THEN
    SELECT firm_id INTO NEW.firm_id
    FROM public.profiles
    WHERE id = CASE
      WHEN TG_OP = 'INSERT' THEN
        CASE
          WHEN NEW.created_by IS NOT NULL THEN NEW.created_by
          WHEN NEW.uploaded_by IS NOT NULL THEN NEW.uploaded_by
          WHEN NEW.received_by IS NOT NULL THEN NEW.received_by
          WHEN NEW.issued_by IS NOT NULL THEN NEW.issued_by
          WHEN NEW.author_id IS NOT NULL THEN NEW.author_id
          WHEN NEW.user_id IS NOT NULL THEN NEW.user_id
          ELSE auth.uid()
        END
      ELSE auth.uid()
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(array[
    'cases', 'clients', 'documents', 'payments',
    'invoices', 'hearings', 'messages', 'notifications', 'notes'
  ]) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'set_firm_id_' || tbl
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER set_firm_id_%s
         BEFORE INSERT ON public.%s
         FOR EACH ROW
         EXECUTE FUNCTION public.set_firm_id_from_creator()',
        tbl, tbl
      );
    END IF;
  END loop;
END $$;

-- =============================================
-- DONE!
-- =============================================
