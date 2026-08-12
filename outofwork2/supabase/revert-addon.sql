-- Revert addon changes: restore unlimited cases for Professional and Firm
UPDATE public.subscription_plans SET max_cases = -1 WHERE slug = 'professional';
UPDATE public.subscription_plans SET max_cases = -1 WHERE slug = 'firm';

-- Drop the addon table (no longer needed)
DROP TABLE IF EXISTS public.firm_addons;
