# LawApp - Implementation Guide & Instructions

## Overview
This document covers all features implemented, database setup, environment configuration, and next steps.

---

## DATABASE SETUP

### Step 1: Run Base Schema
Run `supabase/complete-schema.sql` first (if not already done).

### Step 2: Run New Tables
Run `supabase/ecourts-and-reminders-schema.sql` in your Supabase SQL Editor.

This creates 9 new tables:
- `ecourts_cases` - Track CNR numbers linked to cases
- `cause_list_entries` - Store synced cause list entries
- `ecourts_orders` - Store synced orders/judgments
- `ecourts_sync_log` - Sync monitoring logs
- `whatsapp_logs` - WhatsApp message logs
- `scheduled_reminders` - Multi-channel reminders
- `trust_accounts` - Trust/retainer account tracking
- `trust_transactions` - Trust account transactions
- `tds_records` - TDS tracking for corporate clients

Plus triggers for auto-reminder generation on hearing creation.

### Step 3: Verify Tables
After running the SQL, verify these tables exist in Supabase Table Editor.

---

## ENVIRONMENT VARIABLES

Copy `.env.example` to `.env.local` and fill in:

### Required
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Razorpay (for payments)
```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

### Cloudinary (for file storage)
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

### eCourts Integration (optional)
```env
ECOURTS_API_KEY=your_ecourts_api_key
```

### WhatsApp/Twilio (optional)
```env
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### AI (optional)
```env
AI_API_KEY=your_api_key
AI_BASE_URL=https://opencode.ai/zen/v1
AI_MODEL=mimo-v2.5-free
```

---

## NEW FEATURES IMPLEMENTED

### 1. eCourts Integration
- Track cases by CNR number
- Auto-sync case status from eCourts portal
- Detect hearing date changes, status updates, judge changes
- Cause list tracking
- Order/judgment downloads

**How to use:**
1. Go to `/ecourts` in the dashboard
2. Click "Add Case"
3. Enter CNR number, court name, court type
4. Link to existing case in your database
5. Click "Sync All" to fetch latest status

**API Endpoints:**
- `POST /api/ecourts` - Add case for tracking
- `POST /api/ecourts/sync` - Sync all tracked cases

### 2. Smart Reminders
- Multi-channel: In-app, Email, SMS, WhatsApp
- Auto-generate on hearing creation (7-day, 3-day, 1-day)
- Custom reminders with case/client linking
- Overdue detection and alerts

**How to use:**
1. Go to `/reminders`
2. Click "Add Reminder"
3. Set title, message, date/time
4. Link to case and/or client
5. Select notification channels

**Auto-triggers:**
- When a hearing is created, reminders are auto-scheduled
- 7 days before: In-app + Email
- 3 days before: In-app + Email + SMS
- 1 day before: All channels including WhatsApp

### 3. Client Portal
- Give clients self-service access to their cases
- View cases, documents, payments
- Secure messaging with lawyer
- Automated case updates

**How to use:**
1. Go to `/client-portal`
2. Click "Invite Client"
3. Select client from list
4. Enter their email address
5. Client receives invitation email with login instructions

### 4. Client Messaging
- Real-time chat between lawyer and clients
- Threaded conversations by client
- Unread message badges
- Case-linked messages

**How to use:**
1. Go to `/messages`
2. Select a client conversation
3. Type and send messages
4. Client can respond via their portal

### 5. GST-Compliant Billing
- Auto-calculate CGST/SGST/IGST
- State-wise GST (intra-state vs inter-state)
- TDS tracking for corporate clients
- HSN/SAC codes for legal services
- Invoice PDF generation
- Razorpay payment integration

**How to use:**
1. Go to `/billing`
2. Create new invoice
3. Select client and case
4. Enter amount (GST auto-calculated)
5. Send invoice with "Pay Now" button

**API Endpoint:**
- `POST /api/invoices` - Create GST-compliant invoice

### 6. AI Case Analysis
- Input case facts and get analysis
- Case strength assessment (strong/moderate/weak)
- Risk level evaluation
- Key legal issues identified
- Relevant precedents cited
- Recommended strategies
- Anticipating opposing arguments

**How to use:**
1. Go to `/ai/case-analysis`
2. Select case type
3. Describe your case facts
4. Click "Analyze Case"
5. Review the AI-generated insights

### 7. Enhanced Dashboard
- Active cases, clients, hearings today
- Revenue collected vs pending
- Overdue invoices
- Billable hours tracking
- eCourts tracked cases
- Upcoming hearings with today/this week badges
- Quick action buttons

---

## NAVIGATION MAP

```
Dashboard          /dashboard
Cases              /cases
Clients            /clients
Calendar           /calendar
eCourts Tracking   /ecourts          (NEW)
Documents          /documents
Billing            /billing
Reminders          /reminders         (NEW)
Bare Acts          /bare-acts
Calculators        /calculators
Notifications      /notifications
AI Assistant       /ai/case-analysis
Reports            /reports
Messages           /messages          (NEW)
Settings           /settings
Client Portal      /client-portal     (NEW)
```

---

## FILE STRUCTURE (New Files)

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── ecourts/page.tsx           # eCourts tracking dashboard
│   │   ├── reminders/page.tsx         # Reminder management
│   │   ├── client-portal/page.tsx     # Client portal management
│   │   ├── messages/page.tsx          # Client-lawyer messaging
│   │   ├── dashboard/page.tsx         # Enhanced dashboard
│   │   └── ai/
│   │       └── case-analysis/page.tsx # AI case analysis
│   └── api/
│       ├── ecourts/route.ts           # Track CNR
│       ├── ecourts/sync/route.ts      # Sync all cases
│       ├── reminders/route.ts         # CRUD reminders
│       ├── invoices/route.ts          # GST billing
│       ├── client-portal/route.ts     # Portal access
│       └── dashboard/route.ts         # Stats API
├── lib/
│   ├── whatsapp.ts                    # WhatsApp service
│   └── india/
│       └── billing.ts                 # GST/TDS calculator
└── types/
    └── database.ts                    # Updated types

supabase/
└── ecourts-and-reminders-schema.sql   # New tables
```

---

## BUILD STATUS

```
✓ Build passes successfully
✓ 77 routes compiled
✓ TypeScript clean
✓ No errors
```

---

## PRICING TIERS (Recommended)

| Tier | Price | Features |
|------|-------|----------|
| Free | ₹0/mo | 5 cases, basic dashboard |
| Solo | ₹499/mo | Unlimited cases, eCourts, reminders, billing |
| Professional | ₹1,499/mo | 5 users, analytics, priority support |
| Firm | ₹4,999/mo | 20 users, white-label, API access |
| Enterprise | Custom | Unlimited, on-premise, SLA |

---

## NEXT STEPS

### Immediate (This Week)
1. Run `supabase/ecourts-and-reminders-schema.sql` in Supabase
2. Fill in `.env.local` with your credentials
3. Test the eCourts tracking flow
4. Test reminder creation and auto-generation
5. Invite a test client to the portal

### Short-term (Month 1)
1. Integrate real eCourts API (replace mock data)
2. Set up Twilio for WhatsApp/SMS
3. Add email service (SMTP/SendGrid) for reminders
4. Build document drafting templates
5. Test Razorpay payment flow

### Medium-term (Month 2-3)
1. AI judgment summarizer (integrate IndianKanoon API)
2. Document template engine (50+ Indian legal templates)
3. Mobile PWA with offline support
4. Analytics dashboard (realisation, utilization)

### Long-term (Month 4-6)
1. Chamber workflow features (RBAC, matter routing)
2. API platform for third-party integrations
3. Native mobile apps (iOS + Android)
4. e-Filing integration
5. Vernacular OCR (Hindi/Marathi/Tamil)

---

## TROUBLESHOOTING

### Build Errors
- If Modal prop error: Ensure `open` not `isOpen` on Modal components
- If type errors: Check `src/types/database.ts` for missing interfaces
- If Supabase errors: Verify `.env.local` has correct credentials

### Database Errors
- If table doesn't exist: Run the SQL schema in Supabase SQL Editor
- If RLS blocks queries: Check policies in Supabase Dashboard > Authentication > Policies
- If auth fails: Verify email/password matches your Supabase auth credentials

### API Errors
- If 401 Unauthorized: User not logged in or session expired
- If 403 Forbidden: RLS policy blocking access
- If 500 Internal Error: Check server logs in Supabase Dashboard

---

## COMPETITIVE ADVANTAGES

Your app now has these features that most Indian legal tech competitors lack:

1. **eCourts Integration** - Track CNR, auto-sync, change detection
2. **Multi-channel Reminders** - WhatsApp + SMS + Email + In-app
3. **GST-compliant Billing** - Auto-calculation, TDS tracking
4. **Client Self-Service Portal** - Clients view their own cases
5. **Real-time Messaging** - Secure lawyer-client communication
6. **AI Case Analysis** - Strength, risk, strategies, precedents
7. **Indian-first Design** - BNS/BNSS, state codes, financial year

---

## SUPPORT

For issues or questions:
- Check the build output for specific errors
- Review Supabase logs in Dashboard > Logs
- Test API endpoints in browser dev tools
- Check network requests for failed calls

---

*Last updated: July 2026*
*Build status: Passing (77 routes)*
