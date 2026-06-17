# Yooth Wellness Platform

A full-stack healthcare and wellness platform built with Next.js, Prisma, NextAuth, and Stripe.

## Features

- **Admin Dashboard** — patient management, lab review, orders, appointments, activity log
- **Patient Portal** — profile, lab uploads, treatment plans, orders, consents, messaging
- **Role-Based Access** — Admin, Clinician, and Patient roles with protected routes
- **Lab Tracking** — upload, review, and preview lab result files
- **Treatment Plans** — clinical recommendations and product/protocol linking
- **Orders & Payments** — Stripe Checkout integration with webhook handling
- **Consent Forms** — digital signing with audit trail
- **Messaging** — secure patient-to-staff communication
- **Appointments** — scheduling and status tracking
- **Activity Log** — full audit trail of platform actions

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Prisma 7 + SQLite (dev) / PostgreSQL (production)
- NextAuth v5 (credentials)
- Stripe
- Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run database migration and seed
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Accounts

All accounts use password: `password123`

| Role      | Email                    |
|-----------|--------------------------|
| Admin     | admin@yoothwell.com      |
| Clinician | clinician@yoothwell.com  |
| Patient   | patient@yoothwell.com    |
| Patient 2 | john@yoothwell.com       |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Database connection string |
| `AUTH_SECRET` | NextAuth secret (generate with `openssl rand -base64 32`) |
| `AUTH_URL` | App URL for auth callbacks |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_APP_URL` | Public app URL |

## Production Deployment

1. Switch `DATABASE_URL` to PostgreSQL and install `@prisma/adapter-pg`
2. Update `src/lib/prisma.ts` to use the PostgreSQL adapter
3. Set strong `AUTH_SECRET` and configure Stripe keys
4. Configure Stripe webhook endpoint: `POST /api/stripe/webhook`
5. Use cloud storage (S3) for file uploads instead of local `uploads/` directory
6. Run `npm run build && npm start`

## Project Structure

```
src/
├── app/
│   ├── admin/          # Admin dashboard routes
│   ├── portal/         # Patient portal routes
│   ├── api/            # API routes
│   └── login/          # Auth pages
├── components/
│   ├── ui/             # Shared UI components
│   ├── layout/         # Sidebar navigation
│   └── portal/         # Patient-specific forms
├── lib/                # Utilities, auth, prisma, stripe
└── generated/prisma/   # Generated Prisma client
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:migrate` | Run migrations |
| `npm run db:seed` | Seed demo data |
| `npm run db:reset` | Reset and reseed database |

## Security Notes

- Patient data is scoped by role — patients can only access their own records
- File uploads require authentication
- API routes enforce role and ownership checks
- Activity logging tracks all sensitive actions
- Do not commit `.env` or upload directories to version control
