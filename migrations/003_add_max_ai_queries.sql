-- Migration: Add max_ai_queries to subscription_plans
-- Run this in Supabase SQL Editor

-- 1. Add the column
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS max_ai_queries integer DEFAULT 10;

-- 2. Update AI query limits per plan
UPDATE public.subscription_plans SET max_ai_queries = 10 WHERE slug = 'free';
UPDATE public.subscription_plans SET max_ai_queries = 100 WHERE slug = 'solo';
UPDATE public.subscription_plans SET max_ai_queries = 300 WHERE slug = 'professional';
UPDATE public.subscription_plans SET max_ai_queries = 2000 WHERE slug = 'firm';
UPDATE public.subscription_plans SET max_ai_queries = 5000 WHERE slug = 'enterprise';

-- 3. Verify
SELECT name, slug, price, max_cases, max_users, max_storage_mb, max_ai_queries 
FROM public.subscription_plans 
WHERE is_active = true 
ORDER BY price;
