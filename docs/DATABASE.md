# Database Design

The Yooth Wellness data model is defined in `prisma/schema.prisma` and managed with Prisma 7 migrations.

---

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o| PatientProfile : "has (patients only)"
    User ||--o{ Message : "sends"
    User ||--o{ Message : "receives"
    User ||--o{ Notification : "has"
    User ||--o{ ActivityLog : "performs"
    User ||--o{ Appointment : "provides"
    User ||--o{ LabResult : "reviews"
    User ||--o{ Document : "uploads"

    PatientProfile ||--o{ LabResult : "has"
    PatientProfile ||--o{ TreatmentPlan : "has"
    PatientProfile ||--o{ ClinicalRecommendation : "has"
    PatientProfile ||--o{ Order : "places"
    PatientProfile ||--o{ ConsentForm : "signs"
    PatientProfile ||--o{ Document : "owns"
    PatientProfile ||--o{ Message : "thread"
    PatientProfile ||--o{ Appointment : "books"
    PatientProfile ||--o{ ActivityLog : "related to"

    TreatmentPlan ||--o{ ClinicalRecommendation : "contains"
    ClinicalRecommendation ||--o{ RecommendationProduct : "links"
    Product ||--o{ RecommendationProduct : "recommended in"
    Product ||--o{ OrderItem : "sold as"

    Order ||--o{ OrderItem : "contains"

    User {
        string id PK
        string email UK
        string passwordHash
        string name
        enum role
        boolean isActive
    }

    PatientProfile {
        string id PK
        string userId FK UK
        datetime dateOfBirth
        string medicalHistory
        string allergies
    }

    LabResult {
        string id PK
        string patientId FK
        string testName
        enum status
        string fileUrl
    }

    Order {
        string id PK
        string patientId FK
        string orderNumber UK
        enum status
        float total
        string stripeSessionId
    }
```

---

## Core Entities

### User

Central identity table for all platform users.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `cuid` | Primary key |
| `email` | `string` | Unique login identifier |
| `passwordHash` | `string` | bcrypt hash (never store plaintext) |
| `name` | `string` | Display name |
| `role` | `Role` | `ADMIN`, `CLINICIAN`, or `PATIENT` |
| `isActive` | `boolean` | Soft-disable without deletion |

**Relationships:**
- Patients have one `PatientProfile`
- Staff (Admin/Clinician) do not have a patient profile
- Can send/receive messages, review labs, provide appointments

---

### PatientProfile

Clinical and demographic data for patients. Separated from `User` so staff accounts stay lean and patient charts are clearly scoped.

| Field | Type | Notes |
|-------|------|-------|
| `userId` | `FK → User` | 1:1, cascade delete |
| `dateOfBirth` | `datetime?` | |
| `gender` | `string?` | |
| `address`, `city`, `state`, `zipCode` | `string?` | |
| `emergencyContact`, `emergencyPhone` | `string?` | |
| `medicalHistory` | `string?` | Free-text clinical notes |
| `allergies` | `string?` | |
| `notes` | `string?` | Internal care team notes |

**Owns:** labs, treatment plans, orders, consents, documents, messages, appointments, recommendations

---

### LabResult

| Field | Type | Notes |
|-------|------|-------|
| `testName` | `string` | e.g. "Vitamin D Panel" |
| `testDate` | `datetime?` | When test was performed |
| `status` | `LabStatus` | `PENDING` → `REVIEWED` or `FLAGGED` |
| `results` | `string?` | Interpreted results text |
| `fileUrl` | `string?` | Link to uploaded file |
| `reviewedById` | `FK → User?` | Clinician/admin who reviewed |

**Workflow:** Patient uploads → `PENDING` → staff reviews → `REVIEWED` or `FLAGGED`

---

### TreatmentPlan

| Field | Type | Notes |
|-------|------|-------|
| `title` | `string` | Plan name |
| `description` | `string?` | Overview |
| `goals` | `string?` | Treatment objectives |
| `status` | `TreatmentStatus` | `DRAFT`, `ACTIVE`, `COMPLETED`, `ARCHIVED` |
| `startDate`, `endDate` | `datetime?` | Plan duration |

**Contains:** `ClinicalRecommendation` records

---

### ClinicalRecommendation

Personalized clinical guidance, optionally linked to a treatment plan.

| Field | Type | Notes |
|-------|------|-------|
| `treatmentPlanId` | `FK?` | Optional parent plan |
| `title`, `description` | `string` | Recommendation details |
| `protocol` | `string?` | Dosage / protocol instructions |
| `priority` | `int` | Sort order |
| `isActive` | `boolean` | Soft toggle |

**Links to products** via `RecommendationProduct` join table (dosage + instructions per product).

---

### Product

Wellness products and protocols available for ordering.

| Field | Type | Notes |
|-------|------|-------|
| `name` | `string` | |
| `sku` | `string?` | Unique stock keeping unit |
| `price` | `float` | USD |
| `stripePriceId` | `string?` | Optional pre-created Stripe price |
| `category` | `string?` | e.g. "Supplements", "Protocols" |
| `isActive` | `boolean` | Hide from catalog when false |

---

### Order / OrderItem

| Order field | Notes |
|-------------|-------|
| `orderNumber` | Unique human-readable ID (e.g. `YW-ABC123-XY12`) |
| `status` | `PENDING` → `PAID` → `PROCESSING` → `SHIPPED` → `DELIVERED` |
| `subtotal`, `tax`, `total` | Calculated at creation (8% tax in v1) |
| `stripeSessionId` | Stripe Checkout session |
| `paymentLinkUrl` | Redirect URL for patient payment |

`OrderItem` snapshots `unitPrice` and `total` at order time (price changes don't affect past orders).

---

### ConsentForm

| Field | Type | Notes |
|-------|------|-------|
| `title`, `type` | `string` | e.g. "HIPAA Authorization" |
| `content` | `string?` | Full consent text |
| `status` | `ConsentStatus` | `PENDING` → `SIGNED` |
| `signature` | `string?` | Typed full name |
| `signedAt` | `datetime?` | Timestamp of signing |
| `expiresAt` | `datetime?` | Optional expiration |

---

### Document

Generic file attachment for patient charts (labs, consents, insurance, etc.).

| Field | Notes |
|-------|-------|
| `type` | `DocumentType` enum |
| `fileUrl`, `fileName` | Storage reference |
| `uploadedById` | Staff or patient who uploaded |

---

### Message

Secure messaging tied to a patient thread.

| Field | Notes |
|-------|-------|
| `patientId` | All messages belong to a patient context |
| `fromId`, `toId` | Sender and recipient users |
| `isRead` | Read tracking |

---

### Appointment

| Field | Notes |
|-------|-------|
| `providerId` | Optional assigned clinician |
| `scheduledAt` | Appointment datetime |
| `duration` | Minutes (default 30) |
| `status` | `SCHEDULED` → `CONFIRMED` → `COMPLETED` |
| `location` | e.g. "Telehealth", office address |

---

### Notification

In-app notifications per user (not email in v1).

| Field | Notes |
|-------|-------|
| `type` | `INFO`, `ALERT`, `MESSAGE`, `ORDER`, `LAB`, `APPOINTMENT` |
| `link` | Optional deep link (e.g. `/portal/treatment`) |
| `isRead` | Read state |

---

### ActivityLog

Audit trail for compliance and debugging.

| Field | Notes |
|-------|-------|
| `actorId` | Who performed the action (null = system) |
| `patientId` | Related patient if applicable |
| `action` | e.g. `LAB_UPLOADED`, `ORDER_PAID`, `CONSENT_SIGNED` |
| `entityType`, `entityId` | What was affected |
| `metadata` | JSON string for extra context |

---

## Enums Reference

| Enum | Values |
|------|--------|
| `Role` | `ADMIN`, `CLINICIAN`, `PATIENT` |
| `LabStatus` | `PENDING`, `REVIEWED`, `FLAGGED` |
| `TreatmentStatus` | `DRAFT`, `ACTIVE`, `COMPLETED`, `ARCHIVED` |
| `OrderStatus` | `PENDING`, `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED` |
| `ConsentStatus` | `PENDING`, `SIGNED`, `EXPIRED`, `REVOKED` |
| `AppointmentStatus` | `SCHEDULED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW` |
| `DocumentType` | `LAB_RESULT`, `CONSENT`, `TREATMENT_PLAN`, `PRESCRIPTION`, `INSURANCE`, `OTHER` |
| `NotificationType` | `INFO`, `ALERT`, `MESSAGE`, `ORDER`, `LAB`, `APPOINTMENT` |

---

## Relationship Summary

```
User (PATIENT) ──1:1── PatientProfile
                        ├── LabResult[]
                        ├── TreatmentPlan[]
                        │     └── ClinicalRecommendation[]
                        │           └── RecommendationProduct[] ── Product
                        ├── Order[]
                        │     └── OrderItem[] ── Product
                        ├── ConsentForm[]
                        ├── Document[]
                        ├── Message[]
                        ├── Appointment[]
                        └── ActivityLog[]

User (ADMIN/CLINICIAN) ── reviews LabResult
                       ── provides Appointment
                       ── sends/receives Message
```

---

## Migrations

Migrations live in `prisma/migrations/`. To apply:

```bash
npm run db:migrate
```

To reset and reseed (⚠️ destroys data):

```bash
npm run db:reset
```

---

## Production: PostgreSQL

For production, change `datasource` in `schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
}
```

Install the adapter:

```bash
npm install @prisma/adapter-pg pg
```

Update `src/lib/prisma.ts` to use `PrismaPg` instead of `PrismaBetterSqlite3`. See [Project Setup → Production](SETUP.md#production-deployment).

---

## Related Docs

- [Architecture](ARCHITECTURE.md)
- [API Reference](API.md)
- [Auth & Permissions](AUTH.md)
