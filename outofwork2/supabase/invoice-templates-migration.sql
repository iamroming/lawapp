-- =============================================
-- MIGRATION: Invoice Templates + created_by columns
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Add invoice template and bank details to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invoice_template text DEFAULT 'classic';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_account text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_ifsc text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS upi_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invoice_settings jsonb DEFAULT '{
  "show_firm_name": true,
  "show_firm_address": true,
  "show_firm_phone": true,
  "show_firm_email": true,
  "show_firm_gstin": true,
  "show_bank_details": true,
  "show_upi": true,
  "show_client_company": true,
  "show_client_gstin": true,
  "show_case_details": true,
  "show_due_date": true,
  "show_hsn_code": true,
  "show_gst_breakdown": true,
  "show_reverse_charge": true,
  "show_place_of_supply": true,
  "show_terms": true,
  "show_payment_instructions": true,
  "show_footer_notes": true,
  "footer_notes": "",
  "terms_and_conditions": "Payment due within 30 days. Late payments attract 1.5% monthly interest."
}'::jsonb;

-- 2. Add created_by to tables that don't have it
-- (hearings, expenses, time_entries, tasks, notes already have user/author tracking)
-- We add a universal created_by where missing

DO $$
BEGIN
  -- messages: already has sender_id, add created_by for consistency
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'created_by') THEN
    ALTER TABLE public.messages ADD COLUMN created_by uuid REFERENCES public.profiles(id);
  END IF;

  -- scheduled_reminders: already has user_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scheduled_reminders' AND column_name = 'created_by') THEN
    ALTER TABLE public.scheduled_reminders ADD COLUMN created_by uuid REFERENCES public.profiles(id);
  END IF;

  -- notifications: already has user_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'created_by') THEN
    ALTER TABLE public.notifications ADD COLUMN created_by uuid REFERENCES public.profiles(id);
  END IF;

  -- tags: already has created_by
  -- case_team: add created_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'case_team' AND column_name = 'created_by') THEN
    ALTER TABLE public.case_team ADD COLUMN created_by uuid REFERENCES public.profiles(id);
  END IF;

  -- collection_logs: add created_by (already has user_id)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collection_logs' AND column_name = 'created_by') THEN
    ALTER TABLE public.collection_logs ADD COLUMN created_by uuid REFERENCES public.profiles(id);
  END IF;

  -- workflow_events: add created_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_events' AND column_name = 'created_by') THEN
    ALTER TABLE public.workflow_events ADD COLUMN created_by uuid REFERENCES public.profiles(id);
  END IF;
END $$;

-- 3. Create invoice_templates table for firm-level template storage
CREATE TABLE IF NOT EXISTS public.invoice_templates (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  firm_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  template_id text NOT NULL DEFAULT 'classic',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;

-- RLS: firm members can view, owner/partner can manage
DROP POLICY IF EXISTS "invoice_templates_firm_access" ON public.invoice_templates;
CREATE POLICY "invoice_templates_firm_access" ON public.invoice_templates
  FOR ALL USING (
    firm_id = public.get_my_firm_id()
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_invoice_templates_firm ON public.invoice_templates(firm_id);
