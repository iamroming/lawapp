-- Update subscription plan limits
-- Free: 3 cases, 1 user, 200MB storage
-- Solo: 20 cases, 1 user, 1GB storage
-- Professional: 50 cases, 3 users, 3GB storage
-- Firm: 100 cases, 10 users, 7GB storage
-- Enterprise: 500 cases, 50 users, 20GB storage

-- Free plan (if row exists)
UPDATE subscription_plans
SET max_cases = 3, max_users = 1, max_storage_mb = 200
WHERE name = 'Free';

UPDATE subscription_plans
SET max_cases = 20, max_users = 1, max_storage_mb = 1024
WHERE name = 'Solo';

UPDATE subscription_plans
SET max_cases = 50, max_users = 3, max_storage_mb = 3072
WHERE name = 'Professional';

UPDATE subscription_plans
SET max_cases = 100, max_users = 10, max_storage_mb = 7168
WHERE name = 'Firm';

-- Fix existing Enterprise row (was inserted without slug)
UPDATE subscription_plans
SET slug = 'enterprise', description = 'For large firms with advanced needs', max_cases = 500, max_users = 50, max_storage_mb = 20480
WHERE name = 'Enterprise';

-- Insert Enterprise if it doesn't exist at all
INSERT INTO subscription_plans (name, slug, description, price, max_cases, max_users, max_storage_mb)
SELECT 'Enterprise', 'enterprise', 'For large firms with advanced needs', 4999, 500, 50, 20480
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Enterprise');

-- Verify
SELECT name, slug, max_cases, max_users, max_storage_mb FROM subscription_plans ORDER BY price;
