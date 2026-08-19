-- =============================================
-- LAWAPP DATA MIGRATION
-- Generated from Supabase export
-- Run this AFTER the schema is created
-- =============================================

-- Disable triggers during import
SET session_replication_role = 'replica';

-- profiles (2 rows)
INSERT INTO public.profiles (id, full_name, email, phone, role, enrollment_number, specialization, firm_name, avatar_url, is_active, created_at, updated_at, firm_id, payment_type, monthly_salary, percentage_rate, payment_day, pf_enabled, esi_enabled, tds_rate, upi_id, allotment_status, invoice_template, bank_name, bank_account, bank_ifsc, invoice_settings, referral_code, referred_by) VALUES
  ('34d4d71d-ae67-553d-053e-a2f16e000000', 'Firm1', 'iamroming@gmail.com', '9848211242', 'owner', NULL, '[]'::jsonb, 'Firm1', NULL, TRUE, '2026-08-12T16:05:13.755278+00:00', '2026-08-16T17:34:56.614879+00:00', '34d4d71d-ae67-553d-053e-a2f16e000000', 'fixed_salary', 0, 0, 1, FALSE, FALSE, 0, NULL, 'allotted', 'classic', NULL, NULL, NULL, '{"show_upi":true,"show_terms":true,"footer_notes":"","show_due_date":true,"show_hsn_code":true,"show_firm_name":true,"show_firm_email":true,"show_firm_gstin":true,"show_firm_phone":true,"show_bank_details":true,"show_case_details":true,"show_client_gstin":true,"show_firm_address":true,"show_footer_notes":true,"show_gst_breakdown":true,"show_client_company":true,"show_reverse_charge":true,"show_place_of_supply":true,"terms_and_conditions":"Payment due within 30 days. Late payments attract 1.5% monthly interest.","show_payment_instructions":true}'::jsonb, '7742888E', NULL),
  ('b2cae11e-1270-512a-8875-6b83c7d00000', 'Super Admin', 'mubb@ymail.com', '', 'super_admin', NULL, '[]'::jsonb, 'CaseFiles', NULL, TRUE, '2026-08-12T23:58:16.085655+00:00', '2026-08-16T17:34:56.614879+00:00', NULL, 'fixed_salary', 0, 0, 1, FALSE, FALSE, 0, NULL, 'allotted', 'classic', NULL, NULL, NULL, '{"show_upi":true,"show_terms":true,"footer_notes":"","show_due_date":true,"show_hsn_code":true,"show_firm_name":true,"show_firm_email":true,"show_firm_gstin":true,"show_firm_phone":true,"show_bank_details":true,"show_case_details":true,"show_client_gstin":true,"show_firm_address":true,"show_footer_notes":true,"show_gst_breakdown":true,"show_client_company":true,"show_reverse_charge":true,"show_place_of_supply":true,"terms_and_conditions":"Payment due within 30 days. Late payments attract 1.5% monthly interest.","show_payment_instructions":true}'::jsonb, '72A02FF7', NULL)
ON CONFLICT (id) DO NOTHING;

-- clients (1 rows)
INSERT INTO public.clients (id, user_id, full_name, email, phone, alternate_phone, address, city, state, pincode, id_type, id_number, company_name, gst_number, notes, created_by, deleted_at, created_at, updated_at, firm_id, branch_id) VALUES
  ('55779727-9e69-4f96-96ea-5834cf338bba', NULL, 'dsdgf', 'hitechpostblog@gmail.com', '34353', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '34d4d71d-ae67-553d-053e-a2f16e000000', NULL, '2026-08-16T09:28:04.71797+00:00', '2026-08-16T09:28:04.71797+00:00', '34d4d71d-ae67-553d-053e-a2f16e000000', NULL)
ON CONFLICT (id) DO NOTHING;

-- tags (6 rows)
INSERT INTO public.tags (id, name, color, created_by, firm_id) VALUES
  ('7147232c-1b47-486b-be33-6d68f4604e7d', 'Urgent', '#ef4444', NULL, NULL),
  ('5afa8d6e-ae6e-436b-8584-6e1ed3fe553a', 'Pro Bono', '#10b981', NULL, NULL),
  ('833a808e-f6c5-4541-87df-19fd4824ea17', 'Corporate', '#3b82f6', NULL, NULL),
  ('5528c521-72fd-4f18-923f-eeb67a151a90', 'Criminal', '#8b5cf6', NULL, NULL),
  ('a1eefa9b-4802-4e3b-adb6-721d3aa72c9b', 'Family', '#f59e0b', NULL, NULL),
  ('695a6150-baa4-4f7b-916a-56c5daf54afe', 'Property', '#06b6d4', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- activity_logs (2 rows)
INSERT INTO public.activity_logs (id, user_id, action, entity_type, entity_id, entity_name, details, ip_address, user_agent, created_at) VALUES
  ('c059c7e5-4301-4d30-ac32-2ea7aa1bca27', NULL, 'created', 'invoice', '98ab31cc-8ffb-4993-9122-03c60bd1af5a', 'INV/2026-27/0001', '{}'::jsonb, NULL, NULL, '2026-07-31T17:06:36.320704+00:00'),
  ('3ca957a0-31a5-429c-b5bc-c7fbebec4e14', NULL, 'created', 'document', 'e9d8f9ca-1a2b-4d00-b497-30ec33313a07', '## Full-Stack Software Engineering Services', '{}'::jsonb, NULL, NULL, '2026-08-05T01:19:52.683053+00:00')
ON CONFLICT (id) DO NOTHING;

-- subscription_plans (5 rows)
INSERT INTO public.subscription_plans (id, name, slug, description, price, billing_period, features, max_cases, max_users, max_storage_mb, is_active, created_at, updated_at, addon_price, addon_cases_bonus, max_addons, max_branches) VALUES
  ('fb4e9d68-291e-4d39-8107-d3fb201e409d', 'Free', 'free', 'Try CaseFiles with basic features. Perfect for solo lawyers getting started.', 0, 'monthly', '["3 active cases","1 user","100 MB storage","Basic dashboard","Mobile access"]', 3, 1, 100, TRUE, '2026-07-26T14:27:58.071648+00:00', '2026-08-16T16:50:14.232671+00:00', 0, 0, 0, 0),
  ('c74f4df6-2e68-4e80-ae60-5e3a0bd674b6', 'Solo', 'solo', 'For individual lawyers handling a growing caseload.', 299, 'monthly', '["20 active cases","1 user","1 GB storage","E-filing integration","Court tracking","Invoice generation","Notifications"]', 20, 1, 1024, TRUE, '2026-08-04T02:02:20.245463+00:00', '2026-08-16T16:50:14.782317+00:00', 299, 10, -1, 0),
  ('55cc0341-b3c6-48d4-a2a0-386b92bba27e', 'Professional', 'professional', 'For established lawyers and small teams managing diverse cases.', 799, 'monthly', '["Unlimited active cases","3 users","5 GB storage","Everything in Solo","Team collaboration","Client portal","AI-powered research","Priority support"]', -1, 3, 5120, TRUE, '2026-07-26T14:27:58.071648+00:00', '2026-08-16T16:50:15.184297+00:00', 299, 10, -1, 3),
  ('7af3be0d-fac0-417e-b21b-70402af3e95d', 'Firm', 'firm', 'For law firms that need full team access and unlimited storage.', 1999, 'monthly', '["Unlimited active cases","10 users","20 GB storage","Everything in Professional","Admin controls","Bulk operations","Custom reports","API access"]', -1, 10, 20480, TRUE, '2026-07-26T14:27:58.071648+00:00', '2026-08-16T16:50:15.459042+00:00', 299, 10, -1, 10),
  ('25145b17-55ae-498d-b360-67ed4fdaecb9', 'Enterprise', 'enterprise', 'For large firms and organizations with custom requirements.', 4999, 'monthly', '["Unlimited everything","Unlimited users","Unlimited storage","Everything in Firm","Dedicated support","Custom integrations","SLA guarantee","Onboarding assistance"]', -1, -1, -1, TRUE, '2026-08-16T16:50:15.717437+00:00', '2026-08-16T16:50:15.717437+00:00', 0, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- user_subscriptions (1 rows)
INSERT INTO public.user_subscriptions (id, user_id, plan_id, status, starts_at, expires_at, cancelled_at, payment_method, amount_paid, currency, auto_renew, notes, created_at, updated_at) VALUES
  ('679c1c08-3bc3-44d8-a306-b3906b57c2e3', '34d4d71d-ae67-553d-053e-a2f16e000000', 'c74f4df6-2e68-4e80-ae60-5e3a0bd674b6', 'trialing', '2026-08-12T16:05:22.713+00:00', '2026-08-26T16:05:22.713+00:00', NULL, 'free_trial', 0, 'INR', FALSE, '{"plan_slug":"solo","type":"free_trial"}', '2026-08-12T16:05:22.777262+00:00', '2026-08-12T16:05:22.777262+00:00')
ON CONFLICT (id) DO NOTHING;

-- super_admins (1 rows)
INSERT INTO public.super_admins (id, email, access_level, permissions, last_login, created_at) VALUES
  ('b2cae11e-1270-512a-8875-6b83c7d00000', 'mubb@ymail.com', 'owner', '["all"]'::jsonb, NULL, '2026-08-12T23:58:16.313848+00:00')
ON CONFLICT (id) DO NOTHING;

-- platform_settings (6 rows)
INSERT INTO public.platform_settings (key, value, description, updated_by, updated_at) VALUES
  ('app_name', 'LawApp', 'Application name', NULL, '2026-07-26T14:27:58.071648+00:00'),
  ('maintenance_mode', FALSE, 'Enable maintenance mode', NULL, '2026-07-26T14:27:58.071648+00:00'),
  ('allow_signups', TRUE, 'Allow new user registrations', NULL, '2026-07-26T14:27:58.071648+00:00'),
  ('default_trial_days', 14, 'Default trial period in days', NULL, '2026-07-26T14:27:58.071648+00:00'),
  ('max_upload_size_mb', 50, 'Maximum file upload size in MB', NULL, '2026-07-26T14:27:58.071648+00:00'),
  ('support_email', 'support@lawapp.in', 'Support contact email', NULL, '2026-07-26T14:27:58.071648+00:00')
ON CONFLICT (id) DO NOTHING;

-- coupon_codes (1 rows)
INSERT INTO public.coupon_codes (id, code, plan_id, discount_type, discount_value, max_uses, current_uses, max_per_user, billing_cycle, valid_from, valid_until, is_active, created_by, description, created_at, updated_at) VALUES
  ('5b73ec5f-51a9-455e-a23a-fab2f7f8a92c', 'SAVE30', NULL, 'percent', 30, 100, 0, 1, 'both', '2026-08-06T21:32:04.219502+00:00', '2026-12-31T00:00:00+00:00', TRUE, NULL, '30% off for first 100 users', '2026-08-06T21:32:04.219502+00:00', '2026-08-06T21:32:04.219502+00:00')
ON CONFLICT (id) DO NOTHING;

-- cron_jobs (8 rows)
INSERT INTO public.cron_jobs (id, name, slug, description, endpoint, method, schedule_cron, timezone, is_enabled, last_run_at, last_status, last_error, last_duration_ms, total_runs, total_successes, total_failures, actions, config, created_at, updated_at) VALUES
  ('e3e70565-86c4-46c0-af54-492aa94b2294', 'Daily Digest', 'daily-digest', 'Sends daily digest email with today''s hearings, tasks, and overdue invoices', '/api/daily-digest', 'GET', '30 2 * * *', 'UTC', TRUE, NULL, NULL, NULL, NULL, 0, 0, 0, '{"email":true,"in_app":false,"database":false,"whatsapp":false}'::jsonb, '{}'::jsonb, '2026-08-16T12:27:11.519284+00:00', '2026-08-16T12:27:11.519284+00:00'),
  ('2439e161-d181-443a-a1f8-157b2d09f958', 'Invoice Reminders', 'invoice-reminders', 'Sends payment reminder emails for overdue invoices (7/30/60 days)', '/api/invoices/reminders', 'GET', '0 10 * * *', 'UTC', TRUE, NULL, NULL, NULL, NULL, 0, 0, 0, '{"email":true,"in_app":false,"database":true,"whatsapp":false}'::jsonb, '{}'::jsonb, '2026-08-16T12:27:11.519284+00:00', '2026-08-16T12:27:11.519284+00:00'),
  ('635c1e56-5137-4127-98b6-3cef03874a02', 'Deadline Check', 'deadline-check', 'Checks case limitation dates and creates deadline reminders', '/api/deadlines/check', 'GET', '0 7 * * *', 'UTC', TRUE, NULL, NULL, NULL, NULL, 0, 0, 0, '{"email":true,"in_app":false,"database":true,"whatsapp":true}'::jsonb, '{}'::jsonb, '2026-08-16T12:27:11.519284+00:00', '2026-08-16T12:27:11.519284+00:00'),
  ('7cae9cfb-c66c-4504-b050-cf122b11fe66', 'Cause List Sync', 'cause-list-sync', 'Syncs cause list entries from cases to cause_list_entries table', '/api/cause-list/sync', 'GET', '0 5 * * *', 'UTC', TRUE, NULL, NULL, NULL, NULL, 0, 0, 0, '{"email":false,"in_app":false,"database":true,"whatsapp":false}'::jsonb, '{}'::jsonb, '2026-08-16T12:27:11.519284+00:00', '2026-08-16T12:27:11.519284+00:00'),
  ('0dfa957a-022a-41fa-ad76-d6c822fa1f21', 'Case Alerts Check', 'case-alerts', 'Checks eCourts for case status/hearing changes and sends notifications', '/api/case-alerts/check', 'GET', '0 11 * * *', 'UTC', TRUE, NULL, NULL, NULL, NULL, 0, 0, 0, '{"email":true,"in_app":true,"database":true,"whatsapp":true}'::jsonb, '{}'::jsonb, '2026-08-16T12:27:11.519284+00:00', '2026-08-16T12:27:11.519284+00:00'),
  ('95b49c3b-91b4-417f-bdce-027423305dea', 'Trial Funnel', 'trial-funnel', 'Sends trial reminder emails and WhatsApp messages to users on day 0, 3, 7, 12, 14', '/api/subscriptions/trial-funnel', 'GET', '0 9 * * *', 'UTC', TRUE, NULL, NULL, NULL, NULL, 0, 0, 0, '{"email":false,"in_app":false,"database":true,"whatsapp":true}'::jsonb, '{}'::jsonb, '2026-08-16T12:27:11.519284+00:00', '2026-08-16T15:33:20.491899+00:00'),
  ('6f7ef83c-c9c8-4e87-8cdc-77f6dc822f0f', 'Hearing Reminders', 'hearing-reminders', 'Sends WhatsApp reminders to lawyers and firm owners for tomorrow''s hearings', '/api/reminders/cron', 'GET', '0 18 * * *', 'UTC', TRUE, NULL, NULL, NULL, NULL, 0, 0, 0, '{"email":true,"in_app":false,"database":true,"whatsapp":true}'::jsonb, '{}'::jsonb, '2026-08-16T12:27:11.519284+00:00', '2026-08-16T15:33:27.657543+00:00'),
  ('842fd610-1d08-4a9f-83b8-535f52d6f7fd', 'Expire Trials', 'expire-trials', 'Marks expired trials as expired and restricts user access', '/api/subscriptions/expire-trials', 'GET', '0 8 * * *', 'UTC', TRUE, NULL, NULL, NULL, NULL, 0, 0, 0, '{"email":true,"in_app":false,"database":true,"whatsapp":false}'::jsonb, '{}'::jsonb, '2026-08-16T12:27:11.519284+00:00', '2026-08-16T15:33:40.416262+00:00')
ON CONFLICT (id) DO NOTHING;


-- Re-enable triggers
SET session_replication_role = 'origin';

-- Total: 33 rows migrated