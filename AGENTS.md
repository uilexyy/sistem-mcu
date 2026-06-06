# MCU Baru — Agent Guide

## Project status

Frontend implemented with mock data. Backend (Prisma schema, seed) scaffolded but not wired to a live database. The sole source of truth for requirements is `prompt-sistem-mcu-nextjs-prisma.md`.

## Stack

- **Next.js 14** (App Router), **TypeScript 5.3**, **Tailwind CSS 3.4**, **shadcn/ui**
- **Auth**: NextAuth v5 (Credentials provider, JWT strategy, mock user)
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
  ui/                           → shadcn primitives (button, card, input, table, badge, select, tabs, dialog, dropdown-menu, avatar, separator)
  layout/                       → sidebar.tsx, header.tsx
lib/
  utils.ts                      → cn(), formatCurrency(), formatDate()
  auth.ts                       → NextAuth config (mock authorize)
  prisma.ts                     → Prisma singleton
  audit.ts                      → audit log helper
  store.ts                      → Zustand stores
  data.ts                       → mock data (patients, packages, queue, etc.)
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
- **Middleware** protects: `/dashboard/settings` (ADMIN), `/dashboard/billing` (CASHIER+ADMIN), `/dashboard/results` (DOCTOR+NURSE+ADMIN), `/dashboard/reports` (DOCTOR+ADMIN), `/dashboard/registration` (RECEPTIONIST+ADMIN)
- **Login**: mock admin `admin@rs.com` / `admin123`; no real credential check yet
- **Prisma v5**: use `prisma generate` after schema changes; `prisma validate` to check schema

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (localhost:3000) |
| `npm run build` | Build + typecheck |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npx prisma generate` | Generate Prisma client |
| `npx prisma db push` | Push schema to DB (dev) |
| `npx prisma db seed` | Run seed script |
| `npx prisma studio` | Open DB browser |
| `npx prisma validate` | Validate schema |

## What's next (backend)

1. Connect Prisma to a real PostgreSQL instance
2. Replace mock `lib/data.ts` with SWR hooks calling actual API routes
3. Implement API routes per spec: patients, checkups, results, reports, billing, queue, dashboard/stats
4. Wire NextAuth to Prisma adapter + database sessions
