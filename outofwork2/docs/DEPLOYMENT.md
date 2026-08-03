# Deployment Guide

## Vercel Deployment (Recommended)

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Select "Next.js" as the framework

### Step 3: Configure Environment Variables

Add the following environment variables in Vercel:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `AI_API_KEY` | AI service API key (OpenAI-compatible) |
| `RAZORPAY_KEY_ID` | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay key ID (client-side) |
| `NEXT_PUBLIC_APP_URL` | Your deployed app URL |

### Step 4: Deploy

Click "Deploy" and wait for the build to complete.

### Step 5: Custom Domain (Optional)

1. Go to Project Settings > Domains
2. Add your custom domain
3. Configure DNS as instructed

---

## Docker Deployment

### Prerequisites

- Docker
- Docker Compose

### Step 1: Create Environment File

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values.

### Step 2: Build and Run

```bash
docker-compose up -d --build
```

### Step 3: Verify

```bash
docker-compose ps
docker-compose logs app
```

The app will be available at `http://localhost:3000`.

### Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f app

# Rebuild
docker-compose up -d --build

# Access database
docker-compose exec db psql -U postgres -d lawapp
```

---

## Manual Deployment

### Prerequisites

- Node.js 20+
- npm

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values.

### Step 3: Build

```bash
npm run build
```

### Step 4: Start

```bash
npm start
```

The app will run on port 3000.

---

## Environment Variables Reference

### Supabase

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |

### Authentication

| Variable | Required | Description |
|----------|----------|-------------|

### OpenAI

| Variable | Required | Description |
|----------|----------|-------------|
| `AI_API_KEY` | Yes | AI service API key for AI features |

### Razorpay

| Variable | Required | Description |
|----------|----------|-------------|
| `RAZORPAY_KEY_ID` | Yes | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Yes | Razorpay key secret |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Yes | Razorpay key ID (client-side) |

### Application

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Yes | Application URL |
| `CRON_SECRET` | Yes | Secret for authenticating cron job requests |

---

## Cron Job Setup

Cron jobs are triggered externally via GitHub Actions. All endpoints accept `Authorization: Bearer <CRON_SECRET>` header.

### Required Secrets

Add these to your GitHub repository secrets:

| Secret | Description |
|--------|-------------|
| `APP_URL` | Your deployed app URL (e.g., `https://lawxp.vercel.app`) |
| `CRON_SECRET` | Same value as in your Vercel environment variables |

### Cron Schedule

| Endpoint | Schedule | Description |
|----------|----------|-------------|
| `/api/reminders/cron` | Every hour | Send due reminders via email/SMS/WhatsApp |
| `/api/case-alerts/check` | 8am, 1pm, 6pm IST | Check eCourts for case status changes |
| `/api/cause-list/sync` | 6am IST | Sync cause list entries |
| `/api/deadlines/check` | 8am IST | Check limitation deadlines |
| `/api/invoices/reminders` | Monday 9am IST | Send payment reminders |
| `/api/daily-digest` | 8am IST | Send daily digest emails |
| `/api/subscriptions/expire-trials` | Midnight IST | Expire overdue trials |

### Manual Trigger

Go to GitHub Actions > Cron Jobs > Run workflow > Select job or "all".

### Alternative: cron-job.org

If you prefer cron-job.org over GitHub Actions:

1. Sign up at [cron-job.org](https://cron-job.org)
2. Create a new cron job for each endpoint
3. Set URL to `https://your-app.vercel.app/api/reminders/cron`
4. Set headers: `Authorization: Bearer YOUR_CRON_SECRET`
5. Set schedule per the table above

---

## Database Setup

### Supabase (Recommended)

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Run the migration files from `supabase/` directory in order:
   - `schema.sql`
   - `admin-schema.sql`
   - `super-admin-schema.sql`
   - `complete-schema.sql` (for full schema)

### Local PostgreSQL (Docker)

The Docker Compose setup includes a PostgreSQL database. Access it:

```bash
docker-compose exec db psql -U postgres -d lawapp
```

---

## Supabase Configuration

### Authentication Settings

1. Go to Authentication > Providers
2. Enable Email provider
3. Configure email templates (optional)

### Storage Setup

1. Go to Storage
2. Create a bucket named `documents`
3. Set the bucket policy:
```sql
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');
```

### Row Level Security

Ensure RLS is enabled on all tables. The schema files include RLS policies.

---

## Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Test authentication flow
- [ ] Verify database connections
- [ ] Test payment integration (Razorpay)
- [ ] Test AI features (OpenAI)
- [ ] Verify file uploads work
- [ ] Check email notifications
- [ ] Test client portal access
- [ ] Verify audit logging
- [ ] Monitor error logs

---

## Troubleshooting

### Build Failures

- Ensure all environment variables are set
- Check Node.js version (20+ required)
- Clear `.next` folder and rebuild

### Database Connection Issues

- Verify Supabase URL and keys
- Check if database is running (Docker)
- Verify RLS policies

### Payment Issues

- Verify Razorpay keys
- Check webhook configuration
- Test with Razorpay test mode

### AI Features Not Working

- Verify OpenAI API key
- Check API quota
- Review error logs
