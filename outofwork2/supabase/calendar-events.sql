-- Calendar Rules table
CREATE TABLE IF NOT EXISTS public.calendar_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firm_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  rule_date TIMESTAMPTZ NOT NULL,
  court TEXT,
  rule_type TEXT DEFAULT 'deadline',
  is_important BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar Events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firm_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  event_type TEXT DEFAULT 'meeting',
  is_important BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE public.calendar_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Rules: owners/partners see firm-wide, others see own
CREATE POLICY "Users view firm rules" ON public.calendar_rules
  FOR SELECT USING (
    created_by = auth.uid() OR
    firm_id IN (SELECT firm_id FROM public.profiles WHERE id = auth.uid()) OR
    firm_id = auth.uid()
  );

CREATE POLICY "Users insert rules" ON public.calendar_rules
  FOR INSERT WITH CHECK (
    created_by = auth.uid() OR created_by IS NULL
  );

CREATE POLICY "Users update own rules" ON public.calendar_rules
  FOR UPDATE USING (created_by = auth.uid() OR firm_id = auth.uid());

CREATE POLICY "Users delete own rules" ON public.calendar_rules
  FOR DELETE USING (created_by = auth.uid() OR firm_id = auth.uid());

-- Events: same pattern
CREATE POLICY "Users view firm events" ON public.calendar_events
  FOR SELECT USING (
    created_by = auth.uid() OR
    firm_id IN (SELECT firm_id FROM public.profiles WHERE id = auth.uid()) OR
    firm_id = auth.uid()
  );

CREATE POLICY "Users insert events" ON public.calendar_events
  FOR INSERT WITH CHECK (
    created_by = auth.uid() OR created_by IS NULL
  );

CREATE POLICY "Users update own events" ON public.calendar_events
  FOR UPDATE USING (created_by = auth.uid() OR firm_id = auth.uid());

CREATE POLICY "Users delete own events" ON public.calendar_events
  FOR DELETE USING (created_by = auth.uid() OR firm_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_calendar_rules_date ON public.calendar_rules(rule_date);
CREATE INDEX idx_calendar_rules_firm ON public.calendar_rules(firm_id);
CREATE INDEX idx_calendar_events_date ON public.calendar_events(event_date);
CREATE INDEX idx_calendar_events_firm ON public.calendar_events(firm_id);
