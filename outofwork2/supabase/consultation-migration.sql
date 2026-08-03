-- Consultation Booking System
CREATE TABLE IF NOT EXISTS public.consultation_slots (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  consultation_type text DEFAULT 'general' CHECK (consultation_type IN ('general', 'case_review', 'document_review', 'court_preparation', 'other')),
  fee numeric(10,2) DEFAULT 0,
  duration_minutes integer DEFAULT 30,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.consultations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  lawyer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_email text,
  client_phone text,
  consultation_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  consultation_type text DEFAULT 'general',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes text,
  meeting_link text,
  payment_id text,
  payment_amount numeric(10,2) DEFAULT 0,
  payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  firm_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_consultation_slots_user ON public.consultation_slots(user_id);
CREATE INDEX idx_consultations_lawyer ON public.consultations(lawyer_id);
CREATE INDEX idx_consultations_client ON public.consultations(client_id);
CREATE INDEX idx_consultations_date ON public.consultations(consultation_date);

ALTER TABLE public.consultation_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers manage own slots" ON public.consultation_slots FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users manage consultations" ON public.consultations FOR ALL USING (
  lawyer_id = auth.uid() OR client_id IN (SELECT id FROM public.clients WHERE created_by = auth.uid())
);

CREATE OR REPLACE FUNCTION update_consultations_updated_at()
RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER consultations_updated_at BEFORE UPDATE ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION update_consultations_updated_at();
