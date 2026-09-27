# 🏊 Swan Swim Management

A full-stack swim school management platform built as a **Turborepo monorepo**, commissioned for a real swim school business. Handles class scheduling, student enrollment, attendance tracking, invoicing, report cards, and trial lead conversion across multiple locations.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Scripts Reference](#scripts-reference)
- [Testing](#testing)

---

## Architecture Overview

The system follows a **three-tier architecture** with clear separation of concerns across a monorepo managed by Turborepo and NPM Workspaces.

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client Layer                           │
│                                                                 │
│ ┌────────────────────────┐     ┌─────────────────────────────┐  │
│ │  Public Site           │     │  Staff Portal               │  │
│ │  (Next.js 15)          │     │  (Next.js 15)               │  │
│ │  Port 3002             │     │  Port 3000                  │  │
│ │                        │     │                             │  │
│ │  • Marketing pages     │     │  • Dashboard & analytics    │  │
│ │  • Trial booking       │     │  • Schedule grid            │  │
│ │  • Program catalog     │     │  • Student / guardian CRM   │  │
│ │  • FAQ & contact       │     │  • Invoicing & payments     │  │
│ └────────────┴───────────┘     │  • Report cards             │  │
│              │                 │  • Communications           │  │
│              │                 └──────────────┴──────────────┘  │
│              │                                │                 │
└──────────────┴────────────────────────────────┴─────────────────┘
               │          REST / JSON           │
               ▼                                ▼
┌──────────────┬────────────────────────────────┬─────────────────┐
│                      API Layer (NestJS 11)                      │
│                            Port 3001                            │
│                                                                 │
│   • 30+ resource modules    • Zod DTO validation (nestjs-zod)   │
│   • JWT auth guard          • Role-based access control         │
│   • Rate limiting           • Audit logging                     │
│   • Excel export            • Email via Resend                  │
└────────────────────────────────┴────────────────────────────────┘
                                 │ Prisma 7 ORM
                                 ▼
┌────────────────────────────────┬────────────────────────────────┐
│                     Data Layer (PostgreSQL)                     │
│                       Hosted on Supabase                        │
│                                                                 │
│   • 25+ tables with relational integrity                        │
│   • Transactional invoice generation                            │
│   • Migration-managed schema evolution                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Monorepo** | Turborepo · NPM Workspaces |
| **Frontend** | Next.js 15 (App Router, Turbopack) · React 19 · TypeScript |
| **UI** | shadcn/ui · Radix Primitives · Tailwind CSS v4 · Recharts · Lucide Icons |
| **State & Data Fetching** | TanStack React Query · React Hook Form · Zod v4 |
| **Backend** | NestJS 11 · TypeScript · nestjs-zod validation |
| **Database** | PostgreSQL · Prisma 7 ORM |
| **Auth** | Supabase Auth (`@supabase/ssr`) · JWT Guards |
| **Email** | Resend |
| **PDF** | @react-pdf/renderer |
| **Testing** | Jest 30 · Supertest · 30+ E2E test suites |
| **Deployment** | Vercel (frontend) · Supabase (DB & Auth) |

---

## Key Features

### 📅 Advanced Scheduling Engine
- Interactive weekly schedule grid with color-coded capacity heatmaps (green → red by fill rate)
- Parallel data fetching across all 7 days for optimized load times
- Smart navigation that skips empty timeslots to find the next active class
- On-the-fly class creation and instructor assignment with conflict detection
- Ratio-aware capacity tracking (1:1 Private, 2:1 Semi-Private, 3:1 Group, 6:1 Swimmer)

### 👨‍🎓 Student & Family CRM
- 360° student profiles: enrollment history, financial status, medical info, swim levels
- Guardian management with family views, sibling linking, and waiver compliance tracking
- Flexible booking workflows: trials, makeups, transfers with automatic proration
- Pinned notes system for critical family information

### 💰 Financial Suite
- Multi-line invoice generation with tuition, registration fees, and sibling discounts
- Transaction-wrapped invoice creation for data integrity
- Payment recording (Cash, Credit, Debit, E-Transfer) with partial payment support
- Excel export for end-of-day reconciliation
- PDF invoice rendering with `@react-pdf/renderer`

### 📊 Dashboard & Analytics
- Real-time daily student volume and term enrollment trends
- Weighted capacity calculations based on instructor-to-student ratios
- Collaborative task tracker for operational items
- Enrollment configuration visibility and term management

### 📋 Attendance & Report Cards
- One-click attendance marking (Present, Absent, Excused) with makeup eligibility triggers
- Skill-based report card system with progression tracking (Not Started → Developing → Mastered)
- Status lifecycle management (Draft → Completed → Sent)

### 🔒 Role-Based Access Control
- Three distinct roles: **Manager**, **Supervisor**, **Guardian** — each with scoped permission boundaries
- Multi-location support within a single tenant
- Full audit logging of critical actions

### 🌐 Public Marketing Site *(in development)*
- Mobile-first marketing pages (Home, Programs, About, FAQ, Contact)
- Multi-step guided trial booking engine with real-time capacity checking
- Rate-limited contact forms and SEO-optimized meta tags

### 📧 Communications
- Bulk email system via Resend with delivery tracking
- Communication logs with recipient, success/failure counts
- Filtered recipient selection by class, level, or enrollment status

---

## Project Structure

```
swan-swim-management/
├── apps/
│   ├── api/                        # NestJS 11 REST API (Port 3001)
│   │   ├── src/
│   │   │   ├── [module]/           # 30+ feature modules
│   │   │   │   ├── *.controller.ts
│   │   │   │   ├── *.service.ts
│   │   │   │   ├── *.module.ts
│   │   │   │   └── dto/            # Zod validation schemas
│   │   │   ├── public/             # Unauthenticated endpoints
│   │   │   └── common/             # Guards, filters, interceptors
│   │   └── test/                   # 30+ E2E test suites
│   │
│   ├── web/                        # Next.js 15 Staff Portal (Port 3000)
│   │   └── src/
│   │       ├── app/                # App Router pages
│   │       │   └── (main)/
│   │       │       ├── dashboard/
│   │       │       ├── schedule/
│   │       │       ├── students/
│   │       │       ├── guardians/
│   │       │       ├── enrollments/
│   │       │       ├── invoices/
│   │       │       ├── payments/
│   │       │       ├── trials/
│   │       │       └── admin/      # Curriculum, instructors, comms, etc.
│   │       ├── components/         # Reusable UI widgets (shadcn/ui)
│   │       ├── hooks/              # TanStack Query & custom hooks
│   │       └── lib/                # Supabase client, API helpers, utils
│   │
│   └── public/                     # Next.js 15 Public Site (Port 3002)
│       └── src/
│           ├── app/                # Marketing routes
│           │   ├── programs/
│           │   ├── trial/
│           │   ├── faq/
│           │   ├── about/
│           │   └── contact/
│           ├── components/         # Landing hero, booking form, etc.
│           └── lib/                # Public API client
│
├── packages/
│   ├── db/                         # Prisma schema, migrations & seed
│   │   └── prisma/
│   │       ├── schema.prisma       # 25+ models, 710 lines
│   │       └── seed.ts
│   └── shared-types/               # Cross-app TypeScript interfaces
│
├── turbo.json                      # Turborepo pipeline configuration
├── docker-compose.test.yml         # Isolated test database
└── package.json                    # Root workspace configuration
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 10
- **PostgreSQL** (local instance or Supabase project)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/swan-swim-management.git
cd swan-swim-management

# Install all workspace dependencies
npm install

# Configure environment variables
# Copy and fill in the .env files for each app:
#   packages/db/.env        → DATABASE_URL
#   apps/api/.env           → DATABASE_URL, SUPABASE_URL, SUPABASE_KEY
#   apps/web/.env.local     → NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

# Run database migrations
npm run db:migrate

# (Optional) Seed the database with sample data
npm --prefix packages/db run seed

# Start all three apps in parallel
npm run dev
```

Once running:
| App | URL |
|---|---|
| Staff Portal | http://localhost:3000 |
| REST API | http://localhost:3001 |
| Public Site | http://localhost:3002 |

---

## Scripts Reference

All scripts run from the **monorepo root**:

```bash
# Development
npm run dev                         # Start all apps in parallel (Turbo)
npm run build                       # Production build for all workspaces
npm run check-types                 # TypeScript type-check across all apps
npm run lint                        # Lint all workspaces

# Database
npm run db:generate                 # Regenerate Prisma Client after schema changes
npm run db:migrate                  # Create and apply Prisma migrations
npm run db:studio                   # Open Prisma Studio (visual DB browser)
npm --prefix packages/db run seed   # Seed database with sample data

# Environment Switching
npm run env:dev                     # Switch to development environment
npm run env:prod                    # Switch to production environment
```

---

## Testing

The API has a comprehensive **E2E test suite** with 30+ spec files covering every major module:

```bash
# Start a test-isolated Postgres container
npm --prefix apps/api run db:test:start

# Push schema to the test database
npm --prefix apps/api run db:test:push

# Run the full E2E suite
npm --prefix apps/api run test:e2e
```

Test coverage spans: attendance, enrollments, guardians, invoices, payments, makeups, report cards, trial bookings, trial requests, communications, inventory, staff users, and more.

---

## License

All rights reserved. This software was built under contract for a specific client. No license is granted for reuse, modification, or distribution.