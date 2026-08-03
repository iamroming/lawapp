CREATE TABLE IF NOT EXISTS public.client_feedback (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  case_id uuid REFERENCES public.cases(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text text,
  feedback_type text DEFAULT 'general' CHECK (feedback_type IN ('general', 'case_resolution', 'consultation', 'service')),
  is_anonymous boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_client_feedback_client ON public.client_feedback(client_id);
ALTER TABLE public.client_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage feedback" ON public.client_feedback FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Clients can submit feedback" ON public.client_feedback FOR INSERT WITH CHECK (true);
