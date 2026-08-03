-- Matter Intake Forms
CREATE TABLE IF NOT EXISTS public.intake_forms (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  fields jsonb NOT NULL DEFAULT '[]',
  is_active boolean DEFAULT true,
  firm_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.intake_submissions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  form_id uuid REFERENCES public.intake_forms(id) ON DELETE CASCADE NOT NULL,
  submitted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_email text,
  client_phone text,
  data jsonb NOT NULL DEFAULT '{}',
  status text DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'converted', 'archived')),
  notes text,
  firm_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_intake_forms_user ON public.intake_forms(user_id);
CREATE INDEX idx_intake_submissions_form ON public.intake_submissions(form_id);

ALTER TABLE public.intake_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own intake forms" ON public.intake_forms FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage own intake submissions" ON public.intake_submissions FOR ALL USING (
  form_id IN (SELECT id FROM public.intake_forms WHERE user_id = auth.uid())
);
