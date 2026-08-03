# Causly - Flaws Fix & Missing Features Plan

Generated: 2026-07-27

---

## Summary

| Source | Items | Priority Breakdown |
|--------|-------|--------------------|
| 01_GLOBAL_FLAWS.txt | 46 issues | 10 Critical, 9 High, 12 Medium, 9 Low, 6 DB |
| 02_MISSING_FEATURES_AND_TODO.txt | 37 missing features + 120+ TODOs | 10 Critical, 18 Important, 9 Nice-to-have |
| FEATURES.txt | 30 items | All need implementation |
| **Total** | **113+ items** | Grouped into 6 phases below |

---

## Phase 1: Critical Security Fixes (Do First - Cannot Ship Without)

### 1.1 Remove Hardcoded Credentials
- [ ] **[#1]** Remove hardcoded email/password from `src/lib/super-admin.ts`
- [ ] **[#10]** Move owner credentials to `.env.local` + server-side validation only
- [ ] Delete plaintext password from source code entirely
- [ ] Enforce strong password requirements (12+ chars, mixed case, numbers, symbols)

### 1.2 Fix Super Admin Auth Flow
- [ ] **[#2]** Move super admin check from `src/app/(auth)/login/page.tsx` client-side JS to server-side API route
- [ ] **[#3]** Remove client-side upsert into `super_admins` table from login page
- [ ] Create `/api/auth/super-admin` route that validates credentials server-side only
- [ ] Login page calls API route instead of doing client-side comparison

### 1.3 Fix RLS Policies & Tenant Isolation
- [ ] **[#4]** Replace all `auth.role() = 'authenticated'` RLS policies with `user_id = auth.uid()` conditions
- [ ] **[#5]** Add `firm_id` column to: clients, cases, hearings, documents, time_entries, invoices, payments, notes
- [ ] Enforce firm_id in every RLS policy
- [ ] Apply the improved RLS from `supabase/complete-schema.sql` to production schema

### 1.4 Fix Document Security
- [ ] **[#6]** Replace `getPublicUrl()` with signed URLs (expiration) for ALL document access
- [ ] Add confidential document flag enforcement - signed URLs only, never public
- [ ] Update `src/app/(dashboard)/documents/page.tsx` line 97

### 1.5 Server-Side Role Enforcement
- [ ] **[#7]** Add role checks in middleware for `/admin/*` and `/super-admin/*` routes (not just client-side useEffect)
- [ ] Verify role on every API route handler
- [ ] Redirect unauthorized users to `/dashboard` with error message

### 1.6 Rate Limiting & CSRF
- [ ] **[#8]** Add rate limiting on login/signup endpoints (5 attempts per minute)
- [ ] **[#9]** Implement CSRF tokens for state-changing operations
- [ ] Use Supabase Edge Functions or Next.js middleware for rate limiting

---

## Phase 2: Architecture Fixes (Foundation for Everything Else)

### 2.1 Server Components & API Routes
- [ ] **[#12]** Convert data-fetching pages to Server Components where possible (dashboard, cases list, clients list, reports)
- [ ] **[#11]** Ensure all mutations go through API routes, not direct Supabase client calls
- [ ] Add React Query or SWR for client-side data fetching + caching
- [ ] **[#18]** Add environment variable validation using `@t3-oss/env-nextjs`

### 2.2 Error Handling
- [ ] **[#13]** Add `error.tsx` to ALL route segments that are missing it
- [ ] Add global error boundary wrapper in root layout
- [ ] **[FEATURES #23]** Add friendly error page with retry button + "Report Issue" link
- [ ] **[#39]** Map Supabase technical errors to user-friendly messages

### 2.3 Type Safety
- [ ] **[#21]** Remove all `any` types in super-admin pages - create proper interfaces
- [ ] Generate Supabase types from schema (`supabase gen types typescript`)
- [ ] **[FEATURES #21]** Move hardcoded Bare Acts data to JSON file or API endpoint

### 2.4 Code Quality Cleanup
- [ ] **[#20]** Remove unused `date-fns` dependency (or start using it)
- [ ] **[#26]** Create shared `flattenArray()` helper for `Array.isArray(x) ? x[0] : x` pattern
- [ ] **[#27]** Create shared Sidebar base component (Dashboard, Admin, Super Admin share 90% code)
- [ ] **[#29]** Move Bare Acts hardcoded data out of component
- [ ] **[#30]** Add Zod validation to all forms (schemas already exist in `src/lib/validators.ts`)
- [ ] **[#28]** Add `useCallback`/`useMemo` to frequently rendered components

### 2.5 Pagination
- [ ] **[#15]** Add cursor-based pagination to all list views (cases, clients, documents, invoices, etc.)
- [ ] Use the existing `Pagination` component from `src/components/ui/pagination.tsx`
- [ ] Add page size selector (25, 50, 100)
- [ ] **[FEATURES #30]** Add pagination to super-admin activity logs and documents

---

## Phase 3: Missing Core Features (Things Users Need Immediately)

### 3.1 Fix Existing Broken Features
- [ ] **[#19]** Create edit pages: `/cases/[id]/edit` and `/clients/[id]/edit` (pages exist now, verify they work)
- [ ] **[FEATURES #2]** Connect Razorpay payment button to actual checkout flow on client portal
- [ ] **[FEATURES #3]** Implement PDF invoice download (API exists at `/api/invoices/[id]/pdf`, frontend shows "coming soon")
- [ ] **[FEATURES #4]** Implement CSV/PDF report export buttons on reports page
- [ ] **[FEATURES #9]** Persist notification preferences to database

### 3.2 Activity Logging
- [ ] **[#16]** Call `log_activity()` on every mutation (create, update, delete) across all API routes
- [ ] **[FEATURES #16]** Log all case status changes with timestamp and user
- [ ] **[FEATURES #22]** Implement proper audit trail with before/after values

### 3.3 Subscription Limits
- [ ] **[#17]** Add limit checks before every create operation (cases, users, storage)
- [ ] Show current usage vs limits in settings page
- [ ] Block creation when limit reached with upgrade prompt

### 3.4 Fix Number Generation
- [ ] **[#22]** Replace `Math.random()` case number generation with UUID or database sequence
- [ ] **[#23]** Replace `Date.now().toString(36)` invoice number with database sequence
- [ ] Use the `generate_case_number()` and `generate_invoice_number()` functions from complete-schema.sql

### 3.5 Soft Delete
- [ ] **[#41]** Add `deleted_at` column to cases, clients, documents, invoices
- [ ] Filter deleted records in all queries
- [ ] Add "Trash" / "Recycle Bin" view with recovery option
- [ ] **[FEATURES #12]** Add cascade soft-delete for related records

### 3.6 Database Schema Fixes
- [ ] **[#42]** Add `updated_at` triggers on hearings and payments tables
- [ ] **[#43]** Add unique constraint on client email/phone per firm
- [ ] **[#44]** Create tags/case_tags tables (already in complete-schema.sql)
- [ ] **[#45]** Create reminders/notification scheduling table
- [ ] **[#46]** Add `ON DELETE SET NULL` for documents.uploaded_by

---

## Phase 4: India-Specific Features (Competitive Edge)

### 4.1 GST-Compliant Invoices
- [ ] **[MISSING #4]** Full GST invoice format with GSTIN, HSN/SAC, state codes
- [ ] **[FEATURES #18]** Auto-calculate CGST/SGST vs IGST based on place of supply
- [ ] Generate payment receipts with GST info
- [ ] Send receipts via email automatically

### 4.2 Indian Court Hierarchy
- [ ] **[MISSING #9]** Add proper Indian court dropdowns: Supreme Court > High Court > District > Sessions > Magistrate
- [ ] **[MISSING #10]** State > District > Court mapping
- [ ] Replace generic court names in all forms

### 4.3 Additional Calculators
- [ ] **[MISSING #3]** Court fee calculator (state-wise) - already has page at `/calculators/court-fees`
- [ ] **[MISSING #3]** Stamp duty calculator (state-wise) - already has page at `/calculators/stamp-duty`
- [ ] Verify calculators work correctly with actual data

### 4.4 Document Templates
- [ ] **[MISSING #7]** Vakalatnama template
- [ ] **[MISSING #7]** Legal notice template
- [ ] **[MISSING #7]** Common petition templates (10+ types)
- [ ] **[MISSING #7]** Affidavit template
- [ ] **[MISSING #7]** Case diary management

### 4.5 Localization
- [ ] **[MISSING #6]** Hindi language UI (infrastructure exists with `src/i18n/`)
- [ ] Hindi document templates
- [ ] Indian date/time formatting (DD/MM/YYYY everywhere)
- [ ] Indian phone number validation (+91 format)

### 4.6 Limitation Period Calculator
- [ ] **[MISSING #2]** Auto-calculate appeal (30/60/90 days), revision (90 days), review (30 days) deadlines
- [ ] Already has page at `/calculators/limitation` - verify data is complete

---

## Phase 5: Communication & Client-Facing Features

### 5.1 Notifications System
- [ ] **[MISSING #5]** WhatsApp Business API integration for hearing reminders
- [ ] **[MISSING #5]** SMS reminders
- [ ] **[FEATURES #10]** Real-time notifications via Supabase subscription
- [ ] **[FEATURES #11]** Auto-create reminders for upcoming hearings
- [ ] Daily digest email - "Your hearings tomorrow"
- [ ] Automated payment reminders

### 5.2 Client Portal
- [ ] **[MISSING #11]** Client portal with separate login (already has routes)
- [ ] **[FEATURES #2]** Connect payment processing in client portal
- [ ] Client can upload documents
- [ ] Client communication thread
- [ ] Client feedback/rating system
- [ ] Billable time visibility for clients

### 5.3 Team Management
- [ ] **[FEATURES #6]** Team member invitations (email with unique link)
- [ ] **[FEATURES #7]** User profile editing
- [ ] **[FEATURES #8]** Subscription management from user side
- [ ] **[#31]** Fix admin role toggle to support all roles (paralegal, staff) not just admin/lawyer

### 5.4 Conflict Check
- [ ] **[MISSING #12]** Conflict of interest check - auto-check new client against existing database
- [ ] Show conflicts when creating new client
- [ ] Block or warn on conflict

---

## Phase 6: Polish & Advanced Features

### 6.1 UX Improvements
- [ ] **[#32]** Add skeleton loaders for all loading states
- [ ] **[#33]** Replace `window.confirm()` with Modal component for destructive actions
- [ ] **[FEATURES #22]** Add confirmation dialogs for ALL destructive actions
- [ ] **[#34]** Add optimistic UI updates
- [ ] **[FEATURES #25]** Input validation on phone, email, pincode, GST fields
- [ ] **[FEATURES #24]** Add Suspense loading states for page transitions
- [ ] **[#38]** Standardize spacing across all pages

### 6.2 Dark Mode
- [ ] **[#36]** Implement dark mode with theme toggle in settings
- [ ] CSS variables already exist in `globals.css`
- [ ] Persist theme preference

### 6.3 Search
- [ ] **[FEATURES #20]** Global search (Ctrl+K) - component exists at `src/components/global-search.tsx`
- [ ] Verify it searches across cases, clients, documents, invoices
- [ ] Add keyboard shortcut

### 6.4 Data Export
- [ ] **[MISSING #23]** Export cases, clients, invoices to Excel/CSV
- [ ] **[MISSING #24]** Bulk operations (select multiple, bulk update)

### 6.5 Responsive Tables
- [ ] **[#37]** Convert plain div data tables to proper table elements or use a table library
- [ ] Ensure mobile-friendly layout

### 6.6 Undo & Recovery
- [ ] **[#40]** Add soft delete with undo toast
- [ ] Add recovery option for recently deleted items

---

## Implementation Order (Recommended)

| Priority | Phase | Effort | Blocks |
|----------|-------|--------|--------|
| P0 | Phase 1 (Security) | 3-5 days | Everything - cannot demo without |
| P1 | Phase 2 (Architecture) | 1-2 weeks | All feature work |
| P2 | Phase 3 (Core Fixes) | 1-2 weeks | User-facing reliability |
| P3 | Phase 4 (India Features) | 2-3 weeks | Market differentiation |
| P4 | Phase 5 (Communication) | 2-3 weeks | User retention |
| P5 | Phase 6 (Polish) | 1-2 weeks | User satisfaction |

**Total Estimated Effort: 8-12 weeks for a focused developer**

---

## Items NOT Included (Deferred)

These require significant infrastructure or are out of scope for now:

- [ ] Mobile app (React Native / PWA) - Phase 6+ or separate project
- [ ] E-filing integration - needs court portal API access
- [ ] e-Court integration - needs API access from ecourts.gov.in
- [ ] Email integration (auto-link) - needs IMAP/OAuth setup
- [ ] OCR for documents - needs external service
- [ ] AI case summary - needs production AI model
- [ ] Calendar sync (Google/Outlook) - needs OAuth integration
- [ ] E-signature - needs DocuSign or similar integration
- [ ] Trust accounting (IOLTA) - complex compliance requirements
- [ ] Multi-office support - enterprise feature
- [ ] White label - enterprise feature
- [ ] CI/CD pipeline, Sentry, monitoring - DevOps tasks
- [ ] Landing page, marketing, SEO - separate effort

---

## Notes

1. The `supabase/complete-schema.sql` already has improved RLS, soft deletes, tags, reminders, audit logs, and subscription tables. Apply this schema to fix many issues at once.
2. Zod schemas already exist in `src/lib/validators.ts` - just need to wire them to forms.
3. PDF generation already works via jsPDF in `src/lib/invoices/pdf-generator.ts` - just need frontend button to call the API.
4. Razorpay integration already exists in `src/lib/payments/razorpay.ts` and API routes - just need to connect to UI.
5. The notification system infrastructure exists - email/SMS/WhatsApp are stubs that need real implementations.
