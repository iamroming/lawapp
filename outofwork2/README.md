# CaseFiles - Legal Practice Management System

A comprehensive legal practice management application built with Next.js, Supabase, and modern web technologies.

## Features

- **Case Management** - Track and manage legal cases with full CRUD operations
- **Client Portal** - Dedicated portal for clients to view their cases and documents
- **Invoice & Billing** - Generate invoices with GST support and track payments
- **Payment Integration** - Razorpay integration for online payments
- **Document Management** - Upload, store, and manage legal documents
- **AI-Powered Analysis** - OpenAI integration for case analysis and legal research
- **Hearing Scheduler** - Track court hearings and schedules
- **Reminders System** - Automated reminders for important dates
- **Role-Based Access** - Multi-role system with Super Admin, Admin, and Advocate roles
- **Dashboard & Reports** - Analytics and reporting for practice insights
- **Audit Trail** - Complete audit logging for compliance
- **Multi-language Support** - Internationalization with next-intl

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI**: Tailwind CSS, shadcn/ui components
- **Payments**: Razorpay
- **AI**: OpenAI GPT
- **PDF Generation**: jsPDF
- **Form Validation**: Zod

## Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account
- Razorpay account (for payments)
- OpenAI API key (for AI features)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd CaseFiles
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure the environment variables in `.env.local`

## Environment Setup

### Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings > API
3. Run the SQL migrations from `supabase/` directory

### Razorpay

1. Create an account at [razorpay.com](https://razorpay.com)
2. Get your API keys from the dashboard
3. Add keys to `.env.local`

### OpenAI

1. Get an API key from [platform.openai.com](https://platform.openai.com)
2. Add the key to `.env.local`

## Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Super Admin Login

- Email: `mubb@ymail.com`
- Password: `123mubeen`

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

### Docker

```bash
docker-compose up -d
```

### Manual Deployment

```bash
npm run build
npm start
```

## API Documentation

See [docs/API.md](docs/API.md) for complete API documentation.

## Project Structure

```
CaseFiles/
├── src/
│   ├── app/
│   │   ├── (admin)/          # Admin routes
│   │   ├── (auth)/           # Authentication routes
│   │   ├── (client-portal)/  # Client portal routes
│   │   ├── (dashboard)/      # Dashboard routes
│   │   ├── (marketing)/      # Marketing pages
│   │   ├── (super-admin)/    # Super admin routes
│   │   └── api/              # API routes
│   ├── components/           # React components
│   ├── i18n/                 # Internationalization
│   ├── lib/                  # Utility functions
│   ├── types/                # TypeScript types
│   └── middleware.ts         # Auth middleware
├── public/                   # Static assets
├── supabase/                 # Database schemas
└── docs/                     # Documentation
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is proprietary software. All rights reserved.
