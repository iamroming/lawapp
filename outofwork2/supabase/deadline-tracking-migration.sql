ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS limitation_date date;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS next_action_date date;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS next_action_text text;

CREATE TABLE IF NOT EXISTS public.deadline_reminders (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reminder_date date NOT NULL,
  reminder_type text NOT NULL CHECK (reminder_type IN ('limitation', 'filing', 'hearing', 'custom')),
  message text NOT NULL,
  is_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_deadline_reminders_date ON public.deadline_reminders(reminder_date);
ALTER TABLE public.deadline_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own deadline reminders" ON public.deadline_reminders FOR ALL USING (user_id = auth.uid());
