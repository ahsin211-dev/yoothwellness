# Yooth Wellness — Documentation Index

Welcome to the Yooth Wellness platform documentation. Use this index to find the guide you need.

---

## Getting Started

| Document | When to read |
|----------|--------------|
| [Project Setup](SETUP.md) | First time cloning the repo, running locally, or deploying |
| [Development Guide](DEVELOPMENT.md) | Day-to-day coding, folder conventions, adding features |

---

## System Design

| Document | When to read |
|----------|--------------|
| [Architecture](ARCHITECTURE.md) | Understanding layers, request flows, integrations |
| [Database Design](DATABASE.md) | Schema, relationships, enums, data model decisions |
| [Auth & Permissions](AUTH.md) | Roles, login flow, route protection, patient access rules |
| [API Reference](API.md) | Endpoint list, request bodies, response codes |

---

## Recommended Reading Order

### New developer onboarding

1. [Project Setup](SETUP.md) — get the app running locally
2. [Architecture](ARCHITECTURE.md) — understand how pieces connect
3. [Database Design](DATABASE.md) — learn the data model
4. [Auth & Permissions](AUTH.md) — understand RBAC before touching patient data
5. [Development Guide](DEVELOPMENT.md) — conventions for making changes
6. [API Reference](API.md) — when building or integrating with APIs

### Before a production deploy

1. [Project Setup → Production](SETUP.md#production-deployment)
2. [Architecture → External Integrations](ARCHITECTURE.md#external-integrations)
3. [Auth & Permissions → Security Considerations](AUTH.md#security-considerations)

---

## Quick Links

- **Main README**: [../README.md](../README.md)
- **Prisma schema**: [../prisma/schema.prisma](../prisma/schema.prisma)
- **Seed data**: [../prisma/seed.ts](../prisma/seed.ts)
- **Env template**: [../.env.example](../.env.example)
