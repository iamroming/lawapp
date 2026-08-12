-- Add new columns to coupon_codes table
-- Run this migration on your Supabase database

-- max_per_user: 1 = one-time use per user, -1 = unlimited per user
ALTER TABLE public.coupon_codes
ADD COLUMN IF NOT EXISTS max_per_user integer DEFAULT 1;

-- billing_cycle: 'both', 'monthly', 'annual'
ALTER TABLE public.coupon_codes
ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'both'
  CHECK (billing_cycle IN ('both', 'monthly', 'annual'));

-- Update existing coupons to have sensible defaults
UPDATE public.coupon_codes SET max_per_user = 1 WHERE max_per_user IS NULL;
UPDATE public.coupon_codes SET billing_cycle = 'both' WHERE billing_cycle IS NULL;

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'coupon_codes'
ORDER BY ordinal_position;
