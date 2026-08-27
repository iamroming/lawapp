-- CaseFiles Option A: Aggressive Growth Pricing
-- Run this in Supabase SQL Editor

-- Free Plan
UPDATE public.subscription_plans
SET price = 0,
    max_cases = 10,
    max_users = 10,
    max_storage_mb = 500,
    features = '["10 active cases", "10 users", "500 MB storage", "10 AI queries/month"]'::jsonb,
    description = 'Try it out, no strings attached',
    updated_at = NOW()
WHERE slug = 'free';

-- Solo Plan
UPDATE public.subscription_plans
SET price = 299,
    max_cases = 50,
    max_users = 2,
    max_storage_mb = 1024,
    features = '["50 active cases", "2 users", "1 GB storage", "Court calendar sync", "GST invoicing", "100 AI queries/month", "WhatsApp reminders"]'::jsonb,
    description = 'For individual advocates',
    updated_at = NOW()
WHERE slug = 'solo';

-- Professional Plan
UPDATE public.subscription_plans
SET price = 799,
    max_cases = -1,
    max_users = 5,
    max_storage_mb = 10240,
    features = '["Unlimited cases", "5 users included", "10 GB storage", "AI research & drafting", "Full client portal", "GST invoicing", "E-filing integration", "Priority support"]'::jsonb,
    description = 'For growing law firms',
    badge = 'Most Popular',
    updated_at = NOW()
WHERE slug = 'professional';

-- Firm Plan
UPDATE public.subscription_plans
SET price = 1999,
    max_cases = -1,
    max_users = 20,
    max_storage_mb = 51200,
    features = '["Unlimited cases", "20 users included", "50 GB storage", "Admin controls", "Custom reports", "Audit logging", "Custom branding", "Dedicated support"]'::jsonb,
    description = 'For large firms and chambers',
    updated_at = NOW()
WHERE slug = 'firm';

-- Verify
SELECT name, slug, price, max_cases, max_users, max_storage_mb 
FROM public.subscription_plans 
WHERE is_active = true 
ORDER BY price;
