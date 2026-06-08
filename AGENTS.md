# MCU Baru — Agent Guide

## Project status

Frontend implemented with mock data. Backend (Prisma schema, seed) scaffolded but not wired to a live database. The sole source of truth for requirements is `prompt-sistem-mcu-nextjs-prisma.md`.

## Stack

- **Next.js 14** (App Router), **TypeScript 5.3**, **Tailwind CSS 3.4**, **shadcn/ui**
- **Auth**: NextAuth v5 (Credentials provider, JWT strategy, 5 mock users — 1 per role)
- **State**: Zustand (`lib/store.ts`) — auth, queue, dashboard stores
- **Data**: Mock data in `lib/data.ts` — no live API calls yet
- **ORM scaffolded**: Prisma 5 (`prisma/schema.prisma`) + singleton (`lib/prisma.ts`)
- **Charts**: Recharts (`recharts` + `react-is`)
- **Forms**: Zod validation (`lib/validations/index.ts`)

## Project structure

```
app/
  page.tsx                      → redirects to /login
  layout.tsx                    → root layout (Inter font)
  globals.css                   → Tailwind + CSS variables
  (auth)/login/page.tsx         → login page
  (dashboard)/layout.tsx        → sidebar + header layout
  (dashboard)/dashboard/        → all dashboard pages:
      page.tsx                  → overview (stats cards, chart, queue table)
      patients/page.tsx         → patient list + search + add modal
      patients/[id]/page.tsx    → patient detail + MCU history
      registration/page.tsx     → 3-step registration (patient → package → schedule)
      checkup/page.tsx          → queue per station (LAB/RADIOLOGY/PHYSICAL/SPECIALIST)
      results/page.tsx          → input exam results per patient (auto-flag abnormal)
      reports/page.tsx          → doctor conclusion + fitness status
      billing/page.tsx          → payment confirmation
      settings/page.tsx         → packages / examinations / users (3-tab)
  api/auth/[...nextauth]/route.ts  → NextAuth route handler
middleware.ts                   → role-based route protection
  components/
    ui/                           → shadcn primitives (button, card, input, table, badge, select, tabs, dialog, dropdown-menu, avatar, separator, alert-dialog, label, skeleton, breadcrumb)
    layout/                       → sidebar.tsx, header.tsx
    providers.tsx                 → NextAuth session provider
    theme-provider.tsx            → next-themes wrapper
    animations/                   → stagger.tsx, count-up.tsx, page-transition.tsx
    ui/data-table.tsx             → reusable TanStack-like data table
    ui/error-boundary.tsx         → error boundary wrapper
  lib/
    utils.ts                      → cn(), formatCurrency(), formatDate()
    auth.ts                       → NextAuth config (mock authorize)
    prisma.ts                     → Prisma singleton
    audit.ts                      → audit log helper
    store.ts                      → Zustand stores
    data.ts                       → mock data (patients, packages, queue, etc.)
    use-debounce.ts               → debounce hook
    validations/index.ts          → Zod schemas (login, patient, registration, result, report, billing)
types/index.ts                  → all TypeScript types/enums
prisma/
  schema.prisma                 → full DB schema (11 models, 10 enums)
  seed.ts                       → 2 packages, 10 exam types, 1 admin user
```

## Key conventions

- **UI language**: Indonesian (labels, messages, placeholders)
- **All dashboard pages are "use client"** — mock data, no SSR
- **Sidebar** is collapsible; **Header** shows page title + user dropdown
- **Middleware** protects: `/dashboard/settings` (ADMIN), `/dashboard/billing` (ADMIN+CASHIER), `/dashboard/checkup` (ADMIN+RECEPTIONIST+LAB+RADIOLOGY+DOCTOR+NURSE), `/dashboard/results` (DOCTOR+NURSE+LAB+RADIOLOGY+ADMIN), `/dashboard/reports` (DOCTOR+ADMIN), `/dashboard/registration` (ADMIN+RECEPTIONIST)
- **Login**: pilih role dari 5 akun demo — semua password `123`

## Demo Accounts

| Email | Role | Password |
|-------|------|----------|
| `admin@rs.com` | Admin | 123 |
| `daftar@rs.com` | Pendaftaran | 123 |
| `lab@rs.com` | Lab | 123 |
| `radio@rs.com` | Radiologi | 123 |
| `dokter@rs.com` | Dokter | 123 |
- **Prisma v5**: use `prisma generate` after schema changes; `prisma validate` to check schema

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (localhost:3000) |
| `npm run build` | Build + typecheck |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to DB (dev) |
| `npm run db:migrate` | Run Prisma migration |
| `npm run db:seed` | Run seed script |
| `npm run db:studio` | Open DB browser |
| `npm run db:validate` | Validate schema |

## Backend API Routes (implemented)

```
app/api/
  auth/[...nextauth]/route.ts   → NextAuth handler
  patients/route.ts             → GET (list+pagination+search), POST (create)
  patients/[id]/route.ts        → GET (detail+history), PUT (update)
  patients/search/route.ts      → GET (quick search for dropdown)
  checkups/route.ts             → GET (list+filters), POST (create+transaction→billing+queue)
  checkups/[id]/route.ts        → GET (detail with results/report/billing/queue)
  checkups/[id]/status/route.ts → PATCH (update status)
  results/route.ts              → POST (create with auto-flag abnormal)
  results/route.ts              → GET (?checkupId=), POST (create with auto-flag)
  results/[id]/route.ts         → PUT (update), DELETE (admin only)
  reports/route.ts              → POST (create + auto-complete checkup)
  reports/[checkupId]/route.ts  → GET (report + full checkup data)
  billing/route.ts              → GET (?checkupId=), POST (pay/create receipt)
  billing/[id]/route.ts         → PATCH (update payment status)
  queue/route.ts                → GET (by station + date)
  queue/[id]/call/route.ts      → PATCH (WAITING→CALLED)
  queue/[id]/done/route.ts      → PATCH (CALLED→DONE, auto-complete if all stations done)
  dashboard/stats/route.ts      → GET (today counts + weekly chart data)
```

## Implementation notes

- **Auth**: All routes call `getSessionUser()` and check role via `requireRole()` helper (`lib/api-helpers.ts`)
- **Auto-flag**: `POST/PUT /api/results` compares `valueNumeric` against `normalRangeMin/Max` from ExaminationType, sets status to `ABNORMAL`/`BORDERLINE`/`NORMAL`
- **Registration transaction**: `POST /api/checkups` creates checkup + billing + queue entries in a single `$transaction`
- **Auto-generate numbers**: RM-YYYYMMDD-XXXX (patient) and MCU-YYYYMMDD-XXXX (registration) based on daily counters
- **Audit log**: Every CREATE/UPDATE/DELETE writes to `AuditLog` via `lib/audit.ts`
- **Queue auto-complete**: When last station marks DONE, checkup status automatically becomes COMPLETED
- **Receipt**: Auto-generated `INV-{timestamp}` on payment

## What's next (frontend integration)

1. Connect Prisma to a real PostgreSQL instance (`npm run db:push && npm run db:seed`)
2. Replace mock `lib/data.ts` with SWR hooks calling actual API routes
3. Wire NextAuth to Prisma adapter + database sessions (update `lib/auth.ts`)
4. Add file upload (UploadThing/Cloudinary) for result attachments
