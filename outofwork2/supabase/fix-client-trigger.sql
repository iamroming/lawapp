-- Fix the set_firm_id_from_creator trigger to safely handle missing columns
-- Uses jsonb to check for column existence before accessing

CREATE OR REPLACE FUNCTION public.set_firm_id_from_creator()
RETURNS trigger AS $$
DECLARE
  new_json jsonb;
  creator_id uuid;
BEGIN
  IF NEW.firm_id IS NULL THEN
    new_json := to_jsonb(NEW);
    
    -- Safely find the creator_id from whichever column exists
    creator_id := COALESCE(
      (new_json ->> 'created_by')::uuid,
      (new_json ->> 'uploaded_by')::uuid,
      (new_json ->> 'received_by')::uuid,
      (new_json ->> 'issued_by')::uuid,
      (new_json ->> 'author_id')::uuid,
      (new_json ->> 'user_id')::uuid,
      auth.uid()
    );
    
    SELECT firm_id INTO NEW.firm_id
    FROM public.profiles
    WHERE id = creator_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
