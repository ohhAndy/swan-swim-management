# AGENTS.md — Repository Guide & AI Agent Instructions

Welcome to the **Swan Swim Management** repository. This document serves as the single source of truth for engineering guidelines, architecture patterns, domain rules, and best practices for AI agents and developers working across this codebase.

---

## 1. Monorepo Architecture & Directory Map

```
swan-swim-management/
├── apps/
│   ├── api/                   # NestJS 11 REST API (Port 3001)
│   │   ├── src/
│   │   │   ├── [module]/      # Feature modules (attendance, students, invoices, etc.)
│   │   │   │   ├── *.controller.ts
│   │   │   │   ├── *.service.ts
│   │   │   │   ├── *.module.ts
│   │   │   │   └── dto/       # nestjs-zod DTO schemas
│   │   │   ├── public/        # Unauthenticated endpoints for public website
│   │   │   └── common/        # Filters, guards, interceptors, decorators
│   │   └── test/              # Comprehensive E2E test suite
│   ├── web/                   # Next.js 15 internal management portal (Port 3000)
│   │   ├── src/
│   │   │   ├── app/           # App Router pages & server actions
│   │   │   ├── components/    # Reusable UI & domain-specific widgets (shadcn/ui)
│   │   │   ├── hooks/         # Custom React & TanStack Query hooks
│   │   │   └── lib/           # Supabase client, utils, formatters
│   └── public/                # Next.js 15 customer marketing & trial booking site (Port 3002)
│       ├── src/
│       │   ├── app/           # Marketing routes (/, /programs, /trial, /faq, /contact)
│       │   ├── components/    # Public layout, landing hero, program cards, booking form
│       │   └── lib/           # Public API client (fetchPublicAPI)
├── packages/
│   ├── db/                    # Prisma 7 PostgreSQL schema, client & migrations
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── seed.ts        # Database seed data script
│   └── shared-types/          # Cross-workspace TypeScript interfaces & enums
├── turbo.json                 # Turborepo task pipeline configuration
└── package.json               # Monorepo root configuration (NPM workspaces)
```

---

## 2. Core Domain Rules & Business Logic

### A. Date, Time & Timezone Handling
* **Storage**: All dates and timestamps (`sessionDate`, `dueDate`, `createdAt`, `invoiceDate`) are stored in **UTC** in PostgreSQL.
* **Display & Calculation**:
  * Always format and parse dates with explicit timezone specifications (`timeZone: 'UTC'` or `date-fns-tz`) when calculating or displaying schedules and invoices.
  * **Never** rely on local machine browser timezone for invoice dates or attendance days, as Eastern Time (EDT/EST) conversions can cause off-by-one day bugs.

### B. Capacity & Enrollment Calculations
* **Ratio-Weighted Capacity**:
  * Class offerings support different instructor-to-student ratios (e.g., 1:1 private, 2:1 semi-private, 3:1 group).
  * Weighted capacity differs from raw headcount. Always use standard calculation helpers when computing capacity percentages on the dashboard or schedule grid.

### C. Database Primary & Foreign Keys
* All database IDs must use `cuid()` strings (`@default(cuid())` in Prisma).
* Do not use `uuid()` or `BigInt` for primary keys to ensure chronologically sortable string IDs across the monorepo.

### D. Financial & Invoicing Rules
* Multi-item invoice generation (tuition, registration fees, sibling discounts) must always be wrapped in Prisma transactions (`prisma.$transaction`).
* Invoice numbers must be deterministic or sequence-generated without gaps.

---

## 3. Application Guidelines

### A. `apps/public` (Public Marketing & Trial Booking)
* **Target Audience**: Prospective parents, students, and guardians looking for swim lessons.
* **Design & Aesthetics**:
  * Clean, modern, trustworthy, high-contrast typography, engaging ocean/water visual motifs.
  * Fully responsive with mobile-first navigation and touch-friendly booking steps.
* **API Communication**:
  * Use `fetchPublicAPI<T>(endpoint, options)` from `@/lib/api`.
  * Target only unauthenticated `/public/*` backend endpoints.
  * **Never** import Supabase admin keys or management APIs into `apps/public`.
* **Trial Booking Flow**:
  1. Location selection (`/public/locations`).
  2. Program / Skill level selector or quiz (`/public/levels`).
  3. Preferred schedule slot selection (`/public/offerings`).
  4. Student & Guardian contact details submission (`POST /public/trial-bookings`).
* **Form UX & SEO**:
  * Explicit inline error messages and disabled/spinner states on buttons during submission.
  * Meaningful OpenGraph and meta descriptions on all pages.

### B. `apps/web` (Staff & Guardian Operations Portal)
* **Authentication**: Supabase Auth (`@supabase/ssr`).
  * **Critical**: Pages using cookies/headers for user sessions MUST export:
    ```typescript
    export const dynamic = "force-dynamic";
    ```
* **UI Components**:
  * Build on shadcn/ui primitives (`@radix-ui/*`) located in `apps/web/src/components/ui/`.
  * Use the `cn(...)` utility (`clsx` + `tailwind-merge`) for dynamic Tailwind classes.
  * Use Sonner toasts (`toast.success(...)`, `toast.error(...)`) for operational feedback.
* **Role-Based Views**:
  * Ensure clear permission boundaries between `MANAGER`, `SUPERVISOR`, `INSTRUCTOR`, and `GUARDIAN`.

### C. `apps/api` (NestJS REST API)
* **Validation & DTOs**:
  * Every incoming request body/param/query must be validated using `nestjs-zod` with explicit Zod schemas in the module's `dto/` folder.
* **Controller Structure**:
  * Keep controllers thin; delegate business logic, calculations, and DB access to Injectable services.
  * Use standard NestJS HTTP exceptions (`NotFoundException`, `BadRequestException`, `ForbiddenException`).
* **Public Route Security**:
  * Endpoints under `/public` must use Throttler guards (`@nestjs/throttler`) to prevent automated spam on contact forms and trial bookings.
* **Testing Requirement**:
  * When adding or modifying backend features, update or add corresponding E2E tests in `apps/api/test/`.

### D. `packages/db` (Data Layer & Prisma)
* **Schema Location**: `packages/db/prisma/schema.prisma`.
* **Database Mutations**:
  * Never alter production tables manually. Always generate migrations via `npm run db:migrate`.
  * Run `npm run db:generate` immediately after modifying `schema.prisma`.
* **Query Safety**:
  * Select only required relations (`select` / `include`) to prevent over-fetching large relation graphs.

---

## 4. Development Workflows & Scripts

Run all scripts from the **monorepo root**:

```bash
# -------------------------------------------------------------
# Development & Build
# -------------------------------------------------------------
npm run dev              # Start API (:3001), Web (:3000), and Public (:3002) in parallel
npm run build            # Build all packages and applications
npm run check-types      # Typecheck all workspaces

# -------------------------------------------------------------
# Database Management
# -------------------------------------------------------------
npm run db:generate      # Regenerate Prisma Client
npm run db:migrate       # Run and apply Prisma migrations (dev)
npm run db:studio        # Open Prisma Studio web inspector
npm --prefix packages/db run seed   # Seed database with sample data

# -------------------------------------------------------------
# Testing & Code Quality
# -------------------------------------------------------------
npm --prefix apps/api run test      # Run backend unit tests
npm --prefix apps/api run test:e2e  # Run backend E2E tests
npm run lint             # Lint all workspaces via Turborepo
```

---

## 5. Coding Conventions & Anti-Patterns to Avoid

### Do's:
1. **Co-locate Types**: Put shared models and DTOs in `packages/shared-types` or infer them directly from Zod schemas.
2. **Explicit Client Directives**: Add `'use client'` only to components requiring browser events, React state, or hooks. Keep wrapper layouts and static components as Server Components.
3. **Optimistic & Resilient UI**: Always provide loading skeletons or spinners and handle network failures with recoverable UI states.

### Don'ts (Anti-Patterns):
1. ❌ **Do NOT use `any`**: Always type variables, function parameters, and API responses.
2. ❌ **Do NOT commit nested `package-lock.json`**: Only maintain the root lockfile for workspace dependency synchronization.
3. ❌ **Do NOT hardcode timezone offsets**: Avoid `-04:00` or `EST` strings; use standard UTC timestamps and timezone conversion utilities.
4. ❌ **Do NOT bypass DTO Validation**: Never read unchecked properties directly from `req.body` without a Zod validation pipe.
