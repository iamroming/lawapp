CREATE TABLE IF NOT EXISTS public.collection_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('reminder', 'final_notice', 'legal_notice', 'recovery', 'note')),
  channel text CHECK (channel IN ('email', 'whatsapp', 'sms', 'phone', 'in_person')),
  notes text,
  sent_at timestamptz DEFAULT now()
);
CREATE INDEX idx_collection_logs_invoice ON public.collection_logs(invoice_id);
ALTER TABLE public.collection_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage collections" ON public.collection_logs FOR ALL USING (user_id = auth.uid());
