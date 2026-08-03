CREATE TABLE IF NOT EXISTS public.cause_list_entries (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  firm_id uuid,
  court_name text NOT NULL,
  bench text,
  cause_list_type text DEFAULT 'main',
  serial_number text,
  hearing_date date NOT NULL,
  judge_name text,
  fetched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- If table already existed without hearing_date, add it
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cause_list_entries' AND column_name IS DISTINCT FROM 'hearing_date') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cause_list_entries' AND column_name = 'hearing_date') THEN
      ALTER TABLE public.cause_list_entries ADD COLUMN hearing_date date NOT NULL DEFAULT CURRENT_DATE;
    END IF;
  END IF;
END $$;

-- Add any missing columns from the canonical schema
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cause_list_entries' AND column_name = 'user_id') THEN
    ALTER TABLE public.cause_list_entries ADD COLUMN user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cause_list_entries' AND column_name = 'firm_id') THEN
    ALTER TABLE public.cause_list_entries ADD COLUMN firm_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cause_list_entries' AND column_name = 'court_name') THEN
    ALTER TABLE public.cause_list_entries ADD COLUMN court_name text NOT NULL DEFAULT 'Unknown';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cause_list_entries' AND column_name = 'bench') THEN
    ALTER TABLE public.cause_list_entries ADD COLUMN bench text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cause_list_entries' AND column_name = 'cause_list_type') THEN
    ALTER TABLE public.cause_list_entries ADD COLUMN cause_list_type text DEFAULT 'main';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cause_list_entries' AND column_name = 'serial_number') THEN
    ALTER TABLE public.cause_list_entries ADD COLUMN serial_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cause_list_entries' AND column_name = 'judge_name') THEN
    ALTER TABLE public.cause_list_entries ADD COLUMN judge_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cause_list_entries' AND column_name = 'fetched_at') THEN
    ALTER TABLE public.cause_list_entries ADD COLUMN fetched_at timestamptz DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cause_list_entries' AND column_name = 'created_at') THEN
    ALTER TABLE public.cause_list_entries ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cause_list_date ON public.cause_list_entries(hearing_date);
CREATE INDEX IF NOT EXISTS idx_cause_list_user ON public.cause_list_entries(user_id);
ALTER TABLE public.cause_list_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own cause list" ON public.cause_list_entries;
CREATE POLICY "Users manage own cause list" ON public.cause_list_entries FOR ALL USING (user_id = auth.uid());
