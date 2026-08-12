-- Drop the foreign key constraint on profiles.id → auth.users.id
-- This allows creating profiles with UUIDs that don't exist in auth.users
-- which is necessary when using Firebase Auth + UUID conversion
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
