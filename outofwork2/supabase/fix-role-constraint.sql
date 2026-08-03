-- Run this in Supabase SQL Editor

-- First, see what constraints exist
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND contype = 'c';

-- Drop ALL check constraints on the role column
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'profiles'::regclass 
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%role%'
  LOOP
    EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS ' || r.conname;
    RAISE NOTICE 'Dropped constraint: %', r.conname;
  END LOOP;
END $$;

-- Now migrate any old roles
UPDATE public.profiles SET role = 'owner' WHERE role = 'admin';
UPDATE public.profiles SET role = 'associate' WHERE role = 'lawyer';
UPDATE public.profiles SET role = 'office_admin' WHERE role = 'staff';

-- Add the new constraint
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'owner', 'partner', 'senior_associate', 'associate',
    'junior_associate', 'paralegal', 'intern', 'office_admin', 'super_admin'
  ));

-- Verify
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND contype = 'c';
