-- =============================================
-- WORKFLOW AUTOMATION
-- Event-driven triggers + daily digest
-- =============================================

-- 1. Workflow events table (audit trail for all automation events)
CREATE TABLE IF NOT EXISTS public.workflow_events (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type text NOT NULL, -- hearing_updated, case_status_changed, document_uploaded, daily_digest
  entity_type text NOT NULL, -- case, hearing, document
  entity_id uuid NOT NULL,
  case_id uuid REFERENCES public.cases(id) ON DELETE SET NULL,
  firm_id uuid,
  old_data jsonb,
  new_data jsonb,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_events_type ON public.workflow_events(event_type);
CREATE INDEX IF NOT EXISTS idx_workflow_events_case ON public.workflow_events(case_id);
CREATE INDEX IF NOT EXISTS idx_workflow_events_firm ON public.workflow_events(firm_id);
CREATE INDEX IF NOT EXISTS idx_workflow_events_unprocessed ON public.workflow_events(processed) WHERE processed = false;

ALTER TABLE public.workflow_events ENABLE ROW LEVEL SECURITY;

-- 2. Function: Notify case team when hearing date changes
CREATE OR REPLACE FUNCTION public.notify_hearing_updated()
RETURNS TRIGGER AS $$
DECLARE
  v_case_id uuid;
  v_firm_id uuid;
  v_case_record record;
  v_member record;
  v_old_date text;
  v_new_date text;
BEGIN
  -- Only fire when hearing_date actually changes
  IF OLD.hearing_date IS DISTINCT FROM NEW.hearing_date AND NEW.hearing_date IS NOT NULL THEN
    v_case_id := NEW.case_id;

    -- Get case info
    SELECT c.id, c.firm_id, c.title, c.case_number, c.assigned_to, c.created_by
    INTO v_case_record
    FROM public.cases c WHERE c.id = v_case_id;

    IF NOT FOUND THEN RETURN NEW; END IF;

    v_firm_id := v_case_record.firm_id;
    v_old_date := TO_CHAR(OLD.hearing_date, 'DD Mon YYYY');
    v_new_date := TO_CHAR(NEW.hearing_date, 'DD Mon YYYY');

    -- Log workflow event
    INSERT INTO public.workflow_events (event_type, entity_type, entity_id, case_id, firm_id, old_data, new_data)
    VALUES ('hearing_updated', 'hearing', NEW.id, v_case_id, v_firm_id,
      jsonb_build_object('hearing_date', OLD.hearing_date, 'purpose', OLD.purpose),
      jsonb_build_object('hearing_date', NEW.hearing_date, 'purpose', NEW.purpose));

    -- Notify all case team members + assigned lawyer + created_by
    FOR v_member IN
      SELECT DISTINCT user_id FROM (
        SELECT v_case_record.assigned_to AS user_id WHERE v_case_record.assigned_to IS NOT NULL
        UNION
        SELECT v_case_record.created_by AS user_id WHERE v_case_record.created_by IS NOT NULL
        UNION
        SELECT ct.employee_id AS user_id FROM public.case_team ct WHERE ct.case_id = v_case_id
      ) members WHERE user_id IS NOT NULL
    LOOP
      -- In-app notification
      INSERT INTO public.notifications (user_id, type, title, title_hi, message, message_hi, channels, data)
      VALUES (
        v_member.user_id,
        'hearing_reminder',
        'Hearing Date Updated: ' || v_case_record.case_number,
        'सुनवाई तिथि अपडेट: ' || v_case_record.case_number,
        'The hearing date for "' || v_case_record.title || '" has been changed from ' || v_old_date || ' to ' || v_new_date,
        '"' || v_case_record.title || '" के लिए सुनवाई की तिथि ' || v_old_date || ' से ' || v_new_date || ' में बदल दी गई है',
        ARRAY['in_app', 'email'],
        jsonb_build_object('case_id', v_case_id, 'hearing_id', NEW.id, 'change_type', 'hearing_date',
          'old_date', OLD.hearing_date, 'new_date', NEW.hearing_date)
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function: Notify case team when case status changes
CREATE OR REPLACE FUNCTION public.notify_case_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  v_firm_id uuid;
  v_member record;
  v_old_status text;
  v_new_status text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    v_firm_id := NEW.firm_id;
    v_old_status := OLD.status;
    v_new_status := NEW.status;

    -- Log workflow event
    INSERT INTO public.workflow_events (event_type, entity_type, entity_id, case_id, firm_id, old_data, new_data)
    VALUES ('case_status_changed', 'case', NEW.id, NEW.id, v_firm_id,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status));

    -- Notify all case team members + assigned lawyer + created_by
    FOR v_member IN
      SELECT DISTINCT user_id FROM (
        SELECT NEW.assigned_to AS user_id WHERE NEW.assigned_to IS NOT NULL
        UNION
        SELECT NEW.created_by AS user_id WHERE NEW.created_by IS NOT NULL
        UNION
        SELECT ct.employee_id AS user_id FROM public.case_team ct WHERE ct.case_id = NEW.id
      ) members WHERE user_id IS NOT NULL
    LOOP
      INSERT INTO public.notifications (user_id, type, title, title_hi, message, message_hi, channels, data)
      VALUES (
        v_member.user_id,
        'case_update',
        'Case Status Updated: ' || NEW.case_number,
        'मामले की स्थिति अपडेट: ' || NEW.case_number,
        'Status of "' || NEW.title || '" changed from ' || v_old_status || ' to ' || v_new_status,
        '"' || NEW.title || '" की स्थिति ' || v_old_status || ' से ' || v_new_status || ' में बदली गई',
        ARRAY['in_app', 'email'],
        jsonb_build_object('case_id', NEW.id, 'change_type', 'status',
          'old_status', v_old_status, 'new_status', v_new_status)
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function: Notify case team when document is uploaded
CREATE OR REPLACE FUNCTION public.notify_document_uploaded()
RETURNS TRIGGER AS $$
DECLARE
  v_case_id uuid;
  v_firm_id uuid;
  v_case_record record;
  v_member record;
BEGIN
  v_case_id := NEW.case_id;

  -- Only notify if document is linked to a case
  IF v_case_id IS NULL THEN RETURN NEW; END IF;

  -- Get case info
  SELECT c.id, c.firm_id, c.title, c.case_number, c.assigned_to, c.created_by
  INTO v_case_record
  FROM public.cases c WHERE c.id = v_case_id;

  IF NOT FOUND THEN RETURN NEW; END IF;

  v_firm_id := v_case_record.firm_id;

  -- Log workflow event
  INSERT INTO public.workflow_events (event_type, entity_type, entity_id, case_id, firm_id, old_data, new_data)
  VALUES ('document_uploaded', 'document', NEW.id, v_case_id, v_firm_id,
    NULL,
    jsonb_build_object('title', NEW.title, 'file_name', NEW.file_name, 'category', NEW.category, 'uploaded_by', NEW.uploaded_by));

  -- Notify case team (but NOT the person who uploaded)
  FOR v_member IN
    SELECT DISTINCT user_id FROM (
      SELECT v_case_record.assigned_to AS user_id WHERE v_case_record.assigned_to IS NOT NULL AND v_case_record.assigned_to != NEW.uploaded_by
      UNION
      SELECT v_case_record.created_by AS user_id WHERE v_case_record.created_by IS NOT NULL AND v_case_record.created_by != NEW.uploaded_by
      UNION
      SELECT ct.employee_id AS user_id FROM public.case_team ct WHERE ct.case_id = v_case_id AND ct.employee_id != NEW.uploaded_by
      ) members WHERE user_id IS NOT NULL
  LOOP
    INSERT INTO public.notifications (user_id, type, title, title_hi, message, message_hi, channels, data)
    VALUES (
      v_member.user_id,
      'document_uploaded',
      'New Document: ' || COALESCE(NEW.title, NEW.file_name, 'Untitled'),
      'नया दस्तावेज़: ' || COALESCE(NEW.title, NEW.file_name, 'शीर्षकहीन'),
      'A new document "' || COALESCE(NEW.title, NEW.file_name, 'Untitled') || '" was uploaded to case ' || v_case_record.case_number,
      'दस्तावेज़ "' || COALESCE(NEW.title, NEW.file_name, 'शीर्षकहीन') || '" मामले ' || v_case_record.case_number || ' में अपलोड किया गया',
      ARRAY['in_app'],
      jsonb_build_object('case_id', v_case_id, 'document_id', NEW.id, 'file_name', NEW.file_name)
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create triggers (drop first to avoid duplicates)
DROP TRIGGER IF EXISTS on_hearing_updated ON public.hearings;
CREATE TRIGGER on_hearing_updated
  AFTER UPDATE ON public.hearings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_hearing_updated();

DROP TRIGGER IF EXISTS on_case_status_changed ON public.cases;
CREATE TRIGGER on_case_status_changed
  AFTER UPDATE OF status ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_case_status_changed();

DROP TRIGGER IF EXISTS on_document_uploaded ON public.documents;
CREATE TRIGGER on_document_uploaded
  AFTER INSERT ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_document_uploaded();

-- =============================================
-- DONE
-- =============================================
