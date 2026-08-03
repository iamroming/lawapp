-- =============================================
-- TEST DATA POOL FOR CAUSLY APP
-- Run this after schema is set up
-- Uses fixed UUIDs for predictable testing
-- =============================================

-- IMPORTANT: Replace these UUIDs with actual user IDs after signup
-- Or use these if you create users with specific IDs

-- =============================================
-- 1. PROFILES (Owner + Employees)
-- =============================================
-- First, create a test owner profile (replace OWNER_UUID with actual user id)
-- Then create employee profiles

-- Example: Insert test profiles (run after users sign up)
-- Replace 'OWNER_UUID', 'EMP1_UUID', etc. with actual auth user IDs

/*
INSERT INTO public.profiles (id, full_name, email, role, firm_id, is_active) VALUES
  ('OWNER_UUID', 'Rahul Sharma', 'rahul@testfirm.com', 'owner', 'OWNER_UUID', true),
  ('EMP1_UUID', 'Priya Patel', 'priya@testfirm.com', 'senior_associate', 'OWNER_UUID', true),
  ('EMP2_UUID', 'Amit Kumar', 'amit@testfirm.com', 'associate', 'OWNER_UUID', true),
  ('EMP3_UUID', 'Neha Gupta', 'neha@testfirm.com', 'junior_associate', 'OWNER_UUID', true),
  ('EMP4_UUID', 'Vikram Singh', 'vikram@testfirm.com', 'paralegal', 'OWNER_UUID', true),
  ('EMP5_UUID', 'Ananya Desai', 'ananya@testfirm.com', 'intern', 'OWNER_UUID', true);
*/

-- =============================================
-- 2. CLIENTS (Created by owner)
-- =============================================
INSERT INTO public.clients (full_name, email, phone, address, city, state, created_by, firm_id, deleted_at) VALUES
  ('Rajesh Mehta', 'rajesh@email.com', '9876543210', '12 MG Road', 'Mumbai', 'Maharashtra', auth.uid(), (SELECT firm_id FROM public.profiles WHERE id = auth.uid()), null),
  ('Sunita Verma', 'sunita@email.com', '9876543211', '45 Park Street', 'Kolkata', 'West Bengal', auth.uid(), (SELECT firm_id FROM public.profiles WHERE id = auth.uid()), null),
  ('Arun Joshi', 'arun@email.com', '9876543212', '78 Civil Lines', 'Delhi', 'Delhi', auth.uid(), (SELECT firm_id FROM public.profiles WHERE id = auth.uid()), null),
  ('Meera Nair', 'meera@email.com', '9876543213', '23 MG Road', 'Bangalore', 'Karnataka', auth.uid(), (SELECT firm_id FROM public.profiles WHERE id = auth.uid()), null),
  ('Karan Malhotra', 'karan@email.com', '9876543214', '56 Anna Salai', 'Chennai', 'Tamil Nadu', auth.uid(), (SELECT firm_id FROM public.profiles WHERE id = auth.uid()), null),
  ('Pooja Reddy', 'pooja@email.com', '9876543215', '89 Banjara Hills', 'Hyderabad', 'Telangana', auth.uid(), (SELECT firm_id FROM public.profiles WHERE id = auth.uid()), null),
  ('Sanjay Mishra', 'sanjay@email.com', '9876543216', '34 Hazratganj', 'Lucknow', 'Uttar Pradesh', auth.uid(), (SELECT firm_id FROM public.profiles WHERE id = auth.uid()), null),
  ('Deepa Iyer', 'deepa@email.com', '9876543217', '67 Marine Drive', 'Mumbai', 'Maharashtra', auth.uid(), (SELECT firm_id FROM public.profiles WHERE id = auth.uid()), null);

-- =============================================
-- 3. CASES (Created by owner, various statuses)
-- =============================================
DO $$
DECLARE
  client1_id uuid;
  client2_id uuid;
  client3_id uuid;
  client4_id uuid;
  client5_id uuid;
  owner_fid uuid;
BEGIN
  SELECT id INTO client1_id FROM public.clients WHERE email = 'rajesh@email.com' AND created_by = auth.uid() LIMIT 1;
  SELECT id INTO client2_id FROM public.clients WHERE email = 'sunita@email.com' AND created_by = auth.uid() LIMIT 1;
  SELECT id INTO client3_id FROM public.clients WHERE email = 'arun@email.com' AND created_by = auth.uid() LIMIT 1;
  SELECT id INTO client4_id FROM public.clients WHERE email = 'meera@email.com' AND created_by = auth.uid() LIMIT 1;
  SELECT id INTO client5_id FROM public.clients WHERE email = 'karan@email.com' AND created_by = auth.uid() LIMIT 1;
  SELECT firm_id INTO owner_fid FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.cases (case_number, title, description, case_type, status, priority, client_id, assigned_to, created_by, total_fee, amount_received, filing_date, next_hearing_date) VALUES
    ('CIV-2026-001', 'Mehta vs Verma Property Dispute', 'Property ownership dispute over ancestral property in Mumbai', 'Civil', 'active', 'high', client1_id, auth.uid(), auth.uid(), 150000, 75000, '2026-01-15', now() + interval '3 days'),
    ('CRI-2026-001', 'State vs Kumar Fraud Case', 'Financial fraud allegation involving fake documents', 'Criminal', 'in-progress', 'urgent', client2_id, auth.uid(), auth.uid(), 200000, 100000, '2026-02-20', now() + interval '7 days'),
    ('CIV-2026-002', 'Joshi Family Settlement', 'Family settlement dispute regarding ancestral wealth', 'Civil', 'pending', 'medium', client3_id, auth.uid(), auth.uid(), 100000, 25000, '2026-03-10', now() + interval '14 days'),
    ('CORP-2026-001', 'Nair vs Tech Solutions', 'Breach of contract claim against software vendor', 'Corporate', 'active', 'high', client4_id, auth.uid(), auth.uid(), 300000, 150000, '2026-01-05', now() + interval '5 days'),
    ('FAM-2026-001', 'Malhotra Divorce Proceedings', 'Divorce and custody battle', 'Family', 'under-trial', 'medium', client5_id, auth.uid(), auth.uid(), 175000, 87500, '2025-11-20', now() + interval '10 days'),
    ('CIV-2026-003', 'Reddy Land Acquisition', 'Land acquisition compensation dispute', 'Civil', 'won', 'low', NULL, auth.uid(), auth.uid(), 80000, 80000, '2025-06-15', null),
    ('CRI-2026-002', 'Mishra Bail Application', 'Anticipatory bail application', 'Criminal', 'closed', 'medium', NULL, auth.uid(), auth.uid(), 50000, 50000, '2025-09-01', null),
    ('CORP-2026-002', 'Iyer Corporate Restructuring', 'Company restructuring and merger advisory', 'Corporate', 'active', 'low', NULL, auth.uid(), auth.uid(), 500000, 100000, '2026-04-01', now() + interval '21 days');
END $$;

-- =============================================
-- 4. HEARINGS
-- =============================================
DO $$
DECLARE
  case1_id uuid;
  case2_id uuid;
  case3_id uuid;
BEGIN
  SELECT id INTO case1_id FROM public.cases WHERE case_number = 'CIV-2026-001' LIMIT 1;
  SELECT id INTO case2_id FROM public.cases WHERE case_number = 'CRI-2026-001' LIMIT 1;
  SELECT id INTO case3_id FROM public.cases WHERE case_number = 'CORP-2026-001' LIMIT 1;

  INSERT INTO public.hearings (case_id, hearing_date, court, court_room, judge_name, purpose, notes, created_by) VALUES
    (case1_id, now() + interval '3 days', 'Mumbai High Court', 'Room 42', 'Justice Patil', 'Final arguments', 'Bring all property documents', auth.uid()),
    (case2_id, now() + interval '7 days', 'Delhi District Court', 'Room 15', 'Judge Sharma', 'Witness examination', 'Witness list prepared', auth.uid()),
    (case3_id, now() + interval '14 days', 'Bangalore Civil Court', 'Room 8', 'Judge Rao', 'Mediation hearing', 'Settlement proposal ready', auth.uid()),
    (case1_id, now() + interval '21 days', 'Mumbai High Court', 'Room 42', 'Justice Patil', 'Follow-up hearing', NULL, auth.uid());
END $$;

-- =============================================
-- 5. INVOICES
-- =============================================
DO $$
DECLARE
  case1_id uuid;
  case2_id uuid;
  case3_id uuid;
BEGIN
  SELECT id INTO case1_id FROM public.cases WHERE case_number = 'CIV-2026-001' LIMIT 1;
  SELECT id INTO case2_id FROM public.cases WHERE case_number = 'CRI-2026-001' LIMIT 1;
  SELECT id INTO case3_id FROM public.cases WHERE case_number = 'CORP-2026-001' LIMIT 1;

  INSERT INTO public.invoices (case_id, amount, tax_amount, status, due_date, issued_by) VALUES
    (case1_id, 75000, 13500, 'paid', '2026-02-15', auth.uid()),
    (case1_id, 75000, 13500, 'sent', '2026-06-15', auth.uid()),
    (case2_id, 100000, 18000, 'paid', '2026-03-20', auth.uid()),
    (case2_id, 100000, 18000, 'overdue', '2026-05-20', auth.uid()),
    (case3_id, 150000, 27000, 'sent', '2026-06-01', auth.uid()),
    (case3_id, 150000, 27000, 'draft', '2026-07-01', auth.uid());
END $$;

-- =============================================
-- 6. PAYMENTS
-- =============================================
DO $$
DECLARE
  inv1_id uuid;
  inv3_id uuid;
BEGIN
  SELECT id INTO inv1_id FROM public.invoices WHERE case_id = (SELECT id FROM public.cases WHERE case_number = 'CIV-2026-001') AND status = 'paid' LIMIT 1;
  SELECT id INTO inv3_id FROM public.invoices WHERE case_id = (SELECT id FROM public.cases WHERE case_number = 'CRI-2026-001') AND status = 'paid' LIMIT 1;

  INSERT INTO public.payments (invoice_id, amount, payment_method, reference_number, received_by) VALUES
    (inv1_id, 88500, 'bank_transfer', 'TXN-2026-001', auth.uid()),
    (inv3_id, 118000, 'cheque', 'CHQ-2026-001', auth.uid());
END $$;

-- =============================================
-- 7. TIME ENTRIES
-- =============================================
INSERT INTO public.time_entries (case_id, description, hours, is_billable, date, lawyer_id) VALUES
  ((SELECT id FROM public.cases WHERE case_number = 'CIV-2026-001'), 'Client meeting and case review', 3.5, true, CURRENT_DATE, auth.uid()),
  ((SELECT id FROM public.cases WHERE case_number = 'CIV-2026-001'), 'Document preparation', 2.0, true, CURRENT_DATE - 1, auth.uid()),
  ((SELECT id FROM public.cases WHERE case_number = 'CRI-2026-001'), 'Court hearing attendance', 4.0, true, CURRENT_DATE - 2, auth.uid()),
  ((SELECT id FROM public.cases WHERE case_number = 'CORP-2026-001'), 'Contract review and analysis', 5.5, true, CURRENT_DATE - 3, auth.uid()),
  ((SELECT id FROM public.cases WHERE case_number = 'CORP-2026-001'), 'Research on company law', 3.0, true, CURRENT_DATE - 4, auth.uid()),
  ((SELECT id FROM public.cases WHERE case_number = 'FAM-2026-001'), 'Client consultation', 2.5, true, CURRENT_DATE - 5, auth.uid());

-- =============================================
-- 8. PROFIT SHARING (if table exists)
-- =============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'firm_profit_sharing') THEN
    INSERT INTO public.firm_profit_sharing (firm_id, role, profit_percentage) VALUES
      ((SELECT firm_id FROM public.profiles WHERE id = auth.uid()), 'partner', 15.00),
      ((SELECT firm_id FROM public.profiles WHERE id = auth.uid()), 'senior_associate', 10.00),
      ((SELECT firm_id FROM public.profiles WHERE id = auth.uid()), 'associate', 7.00),
      ((SELECT firm_id FROM public.profiles WHERE id = auth.uid()), 'junior_associate', 4.00),
      ((SELECT firm_id FROM public.profiles WHERE id = auth.uid()), 'paralegal', 2.00),
      ((SELECT firm_id FROM public.profiles WHERE id = auth.uid()), 'intern', 1.00),
      ((SELECT firm_id FROM public.profiles WHERE id = auth.uid()), 'office_admin', 3.00)
    ON CONFLICT (firm_id, role) DO UPDATE SET profit_percentage = EXCLUDED.profit_percentage;
  END IF;
END $$;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
SELECT 'Clients created: ' || COUNT(*)::text FROM public.clients WHERE created_by = auth.uid();
SELECT 'Cases created: ' || COUNT(*)::text FROM public.cases WHERE created_by = auth.uid();
SELECT 'Hearings created: ' || COUNT(*)::text FROM public.hearings WHERE created_by = auth.uid();
SELECT 'Invoices created: ' || COUNT(*)::text FROM public.invoices WHERE issued_by = auth.uid();
SELECT 'Payments received: ' || COUNT(*)::text FROM public.payments WHERE received_by = auth.uid();
SELECT 'Time entries: ' || COUNT(*)::text FROM public.time_entries WHERE lawyer_id = auth.uid();
