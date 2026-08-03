-- Client Tags
CREATE TABLE IF NOT EXISTS public.client_tags (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#3B82F6',
  firm_id uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS public.client_tag_assignments (
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES public.client_tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (client_id, tag_id)
);

ALTER TABLE public.client_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tags" ON public.client_tags FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage tag assignments" ON public.client_tag_assignments FOR ALL USING (true);
