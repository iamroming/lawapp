-- Client Communication History
CREATE TABLE IF NOT EXISTS public.client_communications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('call', 'email', 'whatsapp', 'meeting', 'note', 'sms')),
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound', 'internal')),
  subject text,
  notes text,
  duration_minutes integer,
  attachments text[],
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_client_communications_client ON public.client_communications(client_id);

ALTER TABLE public.client_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage communications for their clients" ON public.client_communications FOR ALL USING (
  client_id IN (SELECT id FROM public.clients WHERE created_by = auth.uid())
);
