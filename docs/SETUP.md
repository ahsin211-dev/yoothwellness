# Project Setup

Complete guide to running Yooth Wellness locally and deploying to production.

---

## Prerequisites

| Requirement | Version | Check |
|-------------|---------|-------|
| Node.js | 20+ | `node -v` |
| npm | 10+ | `npm -v` |
| Git | any | `git --version` |

Optional for payments testing:
- [Stripe account](https://dashboard.stripe.com/register) (test mode)

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/ahsin211-dev/yoothwellness.git
cd yoothwellness
```

### 2. Install dependencies

```bash
npm install
```

This also runs `prisma generate` via the `postinstall` script.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Minimum required for local dev:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="local-dev-secret-change-in-production"
AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Yooth Wellness"
```

Generate a secure `AUTH_SECRET` for anything beyond local play:

```bash
openssl rand -base64 32
```

### 4. Initialize the database

```bash
# Apply migrations (creates dev.db)
npm run db:migrate

# Seed demo data
npm run db:seed
```

### 5. Start the development server

```bash
npm run dev
```

Open **http://localhost:3000**

---

## Environment Variables

| Variable | Required | Description | Example |
|----------|:--------:|-------------|---------|
| `DATABASE_URL` | ✅ | Database connection string | `file:./dev.db` |
| `AUTH_SECRET` | ✅ | NextAuth JWT signing secret | `openssl rand -base64 32` |
| `AUTH_URL` | ✅ | Base URL for auth callbacks | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public app URL (Stripe redirects) | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_NAME` | — | Display name | `Yooth Wellness` |
| `STRIPE_SECRET_KEY` | — | Stripe secret key (test: `sk_test_...`) | |
| `STRIPE_PUBLISHABLE_KEY` | — | Stripe publishable key | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | — | Webhook signing secret | `whsec_...` |

> Stripe variables are optional. Orders are created without them; payment links will be `null`.

---

## Demo Accounts

After seeding (`npm run db:seed`):

| Role | Email | Password | Lands on |
|------|-------|----------|----------|
| Admin | `admin@yoothwell.com` | `password123` | `/admin` |
| Clinician | `clinician@yoothwell.com` | `password123` | `/admin` |
| Patient | `patient@yoothwell.com` | `password123` | `/portal` |
| Patient 2 | `john@yoothwell.com` | `password123` | `/portal` |

The seeded patient (`patient@yoothwell.com`) includes sample labs, a treatment plan, orders, consents, messages, and an appointment.

---

## Database Commands

| Command | What it does |
|---------|--------------|
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:migrate` | Create/apply migrations (`prisma migrate dev`) |
| `npm run db:seed` | Run `prisma/seed.ts` demo data |
| `npm run db:reset` | Drop DB, re-migrate, reseed (⚠️ destroys all data) |

### After changing `prisma/schema.prisma`

```bash
npm run db:migrate
# Enter a migration name when prompted, e.g. "add_field_to_patient"
```

---

## Stripe Setup (Optional)

### 1. Get test API keys

From [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/test/apikeys):

```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### 2. Local webhook testing

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret it prints:

```env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 3. Test checkout flow

1. Log in as `patient@yoothwell.com`
2. Go to `/portal/orders`
3. Select products and click **Checkout with Stripe**
4. Use test card `4242 4242 4242 4242`, any future expiry, any CVC
5. Confirm order status updates to `PAID` after webhook fires

---

## File Uploads

Uploaded files are stored locally during development:

```
uploads/
├── labs/        # Patient lab result uploads
├── documents/   # General documents
└── consents/    # Consent attachments
```

Files are served at `/api/uploads/{folder}/{filename}` and require authentication.

The `uploads/` directory is gitignored. It is created automatically on first upload.

---

## Production Deployment

### 1. Database — switch to PostgreSQL

```bash
npm install @prisma/adapter-pg pg
npm install -D @types/pg
```

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
}
```

Update `src/lib/prisma.ts`:

```typescript
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
export const prisma = new PrismaClient({ adapter });
```

Set `DATABASE_URL`:

```env
DATABASE_URL="postgresql://user:password@host:5432/yoothwellness?sslmode=require"
```

Run migrations against production:

```bash
npx prisma migrate deploy
```

### 2. Environment

| Variable | Production value |
|----------|------------------|
| `AUTH_SECRET` | Strong random string (32+ bytes) |
| `AUTH_URL` | `https://yoothwell.com` |
| `NEXT_PUBLIC_APP_URL` | `https://yoothwell.com` |
| `DATABASE_URL` | PostgreSQL connection string |
| `STRIPE_SECRET_KEY` | Live key (`sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Production webhook secret |

### 3. Stripe webhook (production)

Register endpoint in Stripe Dashboard:

```
POST https://yoothwell.com/api/stripe/webhook
```

Events to listen for: `checkout.session.completed`

### 4. File storage

Replace `src/lib/uploads.ts` with S3 (or compatible) storage. Do not use local filesystem in production.

### 5. Build and start

```bash
npm run build
npm start
```

### Vercel deployment

1. Connect GitHub repo to Vercel
2. Set all environment variables in Vercel project settings
3. Use Vercel Postgres or external PostgreSQL for `DATABASE_URL`
4. Note: local `uploads/` won't persist on Vercel — use S3

---

## Troubleshooting

### `PrismaClient needs to be constructed with a valid PrismaClientOptions`

Prisma 7 requires a driver adapter. Ensure `@prisma/adapter-better-sqlite3` is installed and `src/lib/prisma.ts` uses it.

### `Cannot find module '@/generated/prisma/client'`

```bash
npm run db:generate
```

### Migration conflicts

```bash
npm run db:reset   # dev only — destroys data
```

### Login redirects loop

Check that `AUTH_URL` and `AUTH_SECRET` are set in `.env`.

### Stripe checkout doesn't redirect

Verify `STRIPE_SECRET_KEY` is set and `NEXT_PUBLIC_APP_URL` matches your running URL.

### Upload fails

Ensure the app has write permission to create `uploads/` in the project root.

---

## Verify Installation

```bash
# 1. Build passes
npm run build

# 2. Dev server starts
npm run dev

# 3. Login works
# Visit http://localhost:3000/login
# Sign in as patient@yoothwell.com / password123
# Should land on /portal with dashboard stats
```

---

## Related Docs

- [Development Guide](DEVELOPMENT.md)
- [Architecture](ARCHITECTURE.md)
- [Database Design](DATABASE.md)
