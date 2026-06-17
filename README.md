# Yooth Wellness Platform

A custom healthcare and wellness platform built with Next.js 14, TypeScript, Prisma, and Stripe.

## Features

- **Admin Dashboard** — Patient management, lab results review, orders, treatment plans
- **Patient Portal** — Lab results, treatment plans, orders, documents, messaging
- **Lab Tracking** — Upload and review lab results with biomarker tracking
- **Treatment Plans** — Clinical recommendations with itemized protocols
- **Orders & Payments** — Stripe payment links and checkout sessions
- **Consent Forms** — Digital consent document handling
- **File Uploads** — Secure document storage (Supabase or S3)
- **Messaging** — Secure in-platform messaging between patients and care team
- **Appointments** — Scheduling and virtual visit management
- **Activity Logs** — Full audit trail for all patient interactions
- **Role-based Access** — Admin, Clinician, and Patient roles

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database ORM | Prisma |
| Database | PostgreSQL |
| Authentication | NextAuth.js v5 |
| UI | Tailwind CSS + Radix UI |
| Payments | Stripe |
| File Storage | Supabase Storage or AWS S3 |

## Getting Started

### 1. Prerequisites

- Node.js 18+
- PostgreSQL database
- Stripe account (for payments)
- Supabase project (for file storage) OR AWS S3 bucket

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Fill in the required values in `.env.local`:

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="your-secret-min-32-chars"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Database Setup

```bash
# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate

# Seed with demo data
npm run db:seed
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Demo Credentials

After seeding:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@yoothwellness.com | Admin@123! |
| Clinician | clinician@yoothwellness.com | Clinician@123! |
| Patient | patient@example.com | Patient@123! |

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, register pages
│   ├── (admin)/             # Admin dashboard routes
│   │   ├── dashboard/
│   │   ├── patients/
│   │   ├── labs/
│   │   ├── orders/
│   │   ├── treatment-plans/
│   │   ├── documents/
│   │   ├── messages/
│   │   └── settings/
│   ├── (portal)/            # Patient portal routes
│   │   ├── dashboard/
│   │   ├── profile/
│   │   ├── labs/
│   │   ├── orders/
│   │   ├── treatment-plans/
│   │   ├── documents/
│   │   ├── messages/
│   │   └── appointments/
│   └── api/                 # API routes
│       ├── auth/
│       ├── patients/
│       ├── labs/
│       ├── orders/
│       ├── messages/
│       ├── upload/
│       └── stripe/webhook/
├── components/
│   ├── ui/                  # Reusable UI primitives
│   ├── shared/              # Shared layout components
│   └── forms/               # Form components
├── lib/
│   ├── auth.ts              # NextAuth configuration
│   ├── prisma.ts            # Prisma client singleton
│   ├── stripe.ts            # Stripe helpers
│   ├── upload.ts            # File upload (Supabase/S3)
│   ├── activity.ts          # Activity logging
│   └── utils.ts             # Utilities
├── hooks/                   # React hooks
├── types/                   # TypeScript type definitions
└── middleware.ts             # Route protection
```

## Stripe Webhook Setup

For local development, use the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

For production, configure the webhook endpoint in your Stripe dashboard:
- URL: `https://yourdomain.com/api/stripe/webhook`
- Events: `checkout.session.completed`, `payment_intent.succeeded`

## File Storage

Set `STORAGE_PROVIDER` to either `"supabase"` (default) or `"s3"`.

### Supabase Setup
1. Create a Supabase project
2. Create a storage bucket named `yoothwellness`
3. Set bucket to public (URLs are stored in database)
4. Add your credentials to `.env.local`

### S3 Setup
1. Create an S3 bucket
2. Configure CORS for your domain
3. Create an IAM user with S3 access
4. Add credentials to `.env.local`

## Security Notes

- All patient routes are protected by role-based middleware
- Patients can only see their own data (enforced at API and query level)
- File uploads are validated for type and size server-side
- No patient PII is logged or exposed in error messages
- Stripe webhook signatures are verified
- Activity logging captures all significant actions for audit

## Database Commands

```bash
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema changes (dev)
npm run db:migrate     # Create migration (production)
npm run db:studio      # Open Prisma Studio
npm run db:seed        # Seed demo data
```
