-- =============================================
-- CASE LAWS FEATURE
-- Add acts/sections to cases + case_law_results table
-- =============================================

-- Add acts, sections, clauses to cases table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'acts') THEN
    ALTER TABLE public.cases ADD COLUMN acts text[];
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'sections') THEN
    ALTER TABLE public.cases ADD COLUMN sections text[];
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'clauses') THEN
    ALTER TABLE public.cases ADD COLUMN clauses text[];
  END IF;
END $$;

-- Cache table for case law search results
CREATE TABLE IF NOT EXISTS public.case_law_results (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  citation text,
  court text,
  judgment_date date,
  judges text[],
  excerpt text,
  url text,
  relevance_score numeric(3,2) DEFAULT 0,
  matched_sections text[],
  source text NOT NULL CHECK (source IN ('indian_kanoon', 'internal')),
  fetched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_case_law_case_id ON public.case_law_results(case_id);
CREATE INDEX IF NOT EXISTS idx_case_law_fetched_at ON public.case_law_results(fetched_at);

ALTER TABLE public.case_law_results ENABLE ROW LEVEL SECURITY;

-- RLS: firm isolation via case
DROP POLICY IF EXISTS "case_law_results_firm_isolation" ON public.case_law_results;
CREATE POLICY "case_law_results_firm_isolation" ON public.case_law_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.cases
      WHERE cases.id = case_law_results.case_id
      AND cases.firm_id = (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
      AND (
        public.is_firm_privileged(auth.uid())
        OR cases.created_by = auth.uid()
        OR cases.assigned_to = auth.uid()
      )
    )
  );

-- =============================================
-- DONE
-- =============================================
