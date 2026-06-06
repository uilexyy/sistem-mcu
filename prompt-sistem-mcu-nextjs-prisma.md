# PROMPT: Sistem Medical Check-Up (MCU) — Next.js + Prisma

## Konteks Proyek

Saya seorang IT Support di sebuah rumah sakit. Saya ingin membangun sistem **Medical Check-Up (MCU)** berbasis web yang dapat mengelola alur pemeriksaan pasien dari pendaftaran hingga penerbitan laporan/sertifikat MCU.

---

## Stack Teknologi

- **Framework**: Next.js 14+ (App Router)
- **ORM**: Prisma (dengan PostgreSQL)
- **Auth**: NextAuth.js v5 (Credentials provider + database session)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand atau React Context
- **File Storage**: UploadThing atau Cloudinary (untuk upload hasil lab, foto)
- **Email/Notifikasi**: Resend (email) atau Fonnte/WaBlast (WhatsApp gateway)
- **PDF Generator**: React-PDF atau Puppeteer (untuk cetak sertifikat MCU)
- **Real-time**: SWR polling (untuk kompatibilitas Vercel; alternatif WebSocket untuk VPS)
- **Deployment**: Vercel atau VPS (Docker)

---

## Struktur Folder yang Diinginkan

```
/app
  /api                        ← API Routes (Next.js Route Handlers)
    /auth/[...nextauth]/
    /patients/
    /checkups/
    /results/
    /reports/
    /billing/
    /queue/
    /dashboard/
  /(dashboard)
    /layout.tsx
    /page.tsx                 ← Dashboard ringkasan
    /patients/
      /page.tsx               ← Daftar pasien
      /[id]/page.tsx          ← Detail pasien
    /registration/
      /page.tsx               ← Pendaftaran MCU
    /checkup/
      /page.tsx               ← Antrian & stasiun pemeriksaan
    /results/
      /page.tsx               ← Input hasil pemeriksaan
    /reports/
      /page.tsx               ← Laporan & sertifikat
    /billing/
      /page.tsx               ← Billing & pembayaran
    /settings/
      /page.tsx               ← Pengaturan paket MCU, user
  /(auth)
    /login/page.tsx
/middleware.ts                ← Proteksi route berdasarkan role
/prisma
  /schema.prisma              ← Schema database lengkap
  /seed.ts                    ← Data awal (paket MCU, jenis pemeriksaan, user admin)
/components
  /ui/                        ← shadcn components
  /forms/                     ← Form components
  /tables/                    ← Data table components
  /pdf/                       ← Template PDF sertifikat
/lib
  /prisma.ts                  ← Prisma client singleton
  /auth.ts                    ← Auth config
  /utils.ts
  /validations/               ← Zod schemas
  /audit.ts                   ← Helper untuk audit log
/types                       ← Shared TypeScript types
```

---

## Schema Prisma yang Dibutuhkan

File `prisma/schema.prisma` harus berisi definisi **lengkap dengan syntax Prisma** (`@id`, `@default`, `@relation`, `enum`):

### Enum

```prisma
enum Role {
  ADMIN
  DOCTOR
  NURSE
  RECEPTIONIST
  CASHIER
}

enum Gender {
  MALE
  FEMALE
}

enum BloodType {
  A
  B
  AB
  O
}

enum ExamCategory {
  LAB
  RADIOLOGY
  PHYSICAL
  SPECIALIST
}

enum CheckupStatus {
  REGISTERED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum ResultStatus {
  NORMAL
  ABNORMAL
  BORDERLINE
}

enum FitnessStatus {
  FIT
  FIT_WITH_NOTES
  UNFIT
}

enum PaymentMethod {
  CASH
  TRANSFER
  BPJS
  INSURANCE
}

enum PaymentStatus {
  UNPAID
  PAID
  REFUNDED
}

enum QueueStatus {
  WAITING
  CALLED
  IN_EXAMINATION
  DONE
  SKIPPED
}
```

### 1. User & Auth (termasuk model Prisma Adapter NextAuth)

```prisma
model User {
  id             String   @id @default(cuid())
  name           String?
  email          String   @unique
  password       String?  // hashed, nullable karena bisa login via provider lain
  role           Role     @default(RECEPTIONIST)
  phone          String?
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relasi ke domain
  registeredCheckups  CheckupRegistration[] @relation("registeredBy")
  examinedResults     CheckupResult[]       @relation("examinedBy")
  reviewedReports     CheckupReport[]       @relation("reviewedBy")
  billingHandled      Billing[]             @relation("handledBy")

  // Relasi NextAuth — wajib untuk Prisma Adapter
  accounts   Account[]
  sessions   Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

### 2. Patient (Pasien)

```prisma
model Patient {
  id                   String   @id @default(cuid())
  medicalRecordNumber  String   @unique // auto-generate: RM-YYYYMMDD-XXXX
  name                 String
  dateOfBirth          DateTime
  gender               Gender
  phone                String?
  email                String?
  address              String?
  bloodType            BloodType?
  nik                  String?  @unique // nomor KTP
  photo                String?  // URL foto pasien
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  checkups CheckupRegistration[]
}
```

### 3. MCU Package (Paket MCU)

```prisma
model McuPackage {
  id          String   @id @default(cuid())
  name        String   // contoh: "Paket Basic", "Paket Eksekutif"
  description String?
  price       Int      // dalam rupiah
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  examinations PackageExamination[]
  checkups     CheckupRegistration[]
}

// Junction table: many-to-many antara McuPackage dan ExaminationType
model PackageExamination {
  id                String @id @default(cuid())
  mcuPackageId      String
  examinationTypeId String

  mcuPackage      McuPackage      @relation(fields: [mcuPackageId], references: [id], onDelete: Cascade)
  examinationType ExaminationType @relation(fields: [examinationTypeId], references: [id], onDelete: Cascade)

  @@unique([mcuPackageId, examinationTypeId])
}
```

### 4. Examination Type (Jenis Pemeriksaan)

```prisma
model ExaminationType {
  id              String      @id @default(cuid())
  name            String      // contoh: "Hemoglobin", "Kolesterol Total", "Rontgen Thorax"
  category        ExamCategory
  unit            String?     // contoh: "g/dL", "mg/dL"
  normalRangeMin  Float?      // nilai batas bawah normal (null untuk non-kuantitatif)
  normalRangeMax  Float?      // nilai batas atas normal (null untuk non-kuantitatif)
  description     String?
  isQuantitative  Boolean     @default(true) // false untuk pemeriksaan kualitatif

  packages  PackageExamination[]
  results   CheckupResult[]
}
```

### 5. Checkup Registration (Pendaftaran MCU)

```prisma
model CheckupRegistration {
  id                 String        @id @default(cuid())
  registrationNumber String        @unique // auto-generate: MCU-YYYYMMDD-XXXX
  patientId          String
  mcuPackageId       String
  registeredById     String
  scheduledDate      DateTime
  status             CheckupStatus @default(REGISTERED)
  notes              String?
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  patient     Patient      @relation(fields: [patientId], references: [id])
  mcuPackage  McuPackage   @relation(fields: [mcuPackageId], references: [id])
  registeredBy User         @relation("registeredBy", fields: [registeredById], references: [id])

  results  CheckupResult[]
  report   CheckupReport?
  billing  Billing?
  queue    QueueEntry?
}
```

### 6. Checkup Result (Hasil Pemeriksaan)

```prisma
model CheckupResult {
  id                String       @id @default(cuid())
  checkupId         String
  examinationTypeId String
  valueNumeric      Float?       // untuk pemeriksaan kuantitatif, null jika kualitatif
  valueText         String?      // untuk hasil kualitatif atau string description
  status            ResultStatus // auto-flag berdasarkan normalRangeMin/Max jika kuantitatif
  notes             String?
  attachmentUrl     String?      // URL upload gambar/file (rontgen, EKG, dll)
  examinedById      String
  examinedAt        DateTime     @default(now())

  checkup         CheckupRegistration @relation(fields: [checkupId], references: [id], onDelete: Cascade)
  examinationType ExaminationType     @relation(fields: [examinationTypeId], references: [id])
  examinedBy      User               @relation("examinedBy", fields: [examinedById], references: [id])

  @@unique([checkupId, examinationTypeId])
}
```

### 7. Checkup Report (Laporan & Sertifikat MCU)

```prisma
model CheckupReport {
  id               String        @id @default(cuid())
  checkupId        String        @unique
  doctorConclusion String?
  recommendation   String?
  fitnessStatus    FitnessStatus
  reviewedById     String
  reviewedAt       DateTime      @default(now())
  reportUrl        String?       // URL PDF yang sudah digenerate
  issuedAt         DateTime?

  checkup    CheckupRegistration @relation(fields: [checkupId], references: [id], onDelete: Cascade)
  reviewedBy User                @relation("reviewedBy", fields: [reviewedById], references: [id])
}
```

### 8. Billing

```prisma
model Billing {
  id                String        @id @default(cuid())
  checkupId         String        @unique
  totalAmount       Int
  discountAmount    Int           @default(0)
  finalAmount       Int
  paymentStatus     PaymentStatus @default(UNPAID)
  paymentMethod     PaymentMethod?
  insuranceProvider String?       // nama asuransi jika BPJS/INSURANCE
  paidAt            DateTime?
  receiptNumber     String?       @unique
  handledById       String

  checkup   CheckupRegistration @relation(fields: [checkupId], references: [id], onDelete: Cascade)
  handledBy User                @relation("handledBy", fields: [handledById], references: [id])
}
```

### 9. Queue Entry (Antrian Stasiun) — TAMBAHAN BARU

```prisma
model QueueEntry {
  id          String      @id @default(cuid())
  checkupId   String      @unique
  station     ExamCategory
  queueNumber Int         // nomor antrian per stasiun per hari
  status      QueueStatus @default(WAITING)
  calledAt    DateTime?
  doneAt      DateTime?
  createdAt   DateTime    @default(now())

  checkup CheckupRegistration @relation(fields: [checkupId], references: [id], onDelete: Cascade)
}
```

### 10. Audit Log — TAMBAHAN BARU

```prisma
model AuditLog {
  id         String   @id @default(cuid())
  userId     String
  action     String   // CREATE | UPDATE | DELETE | PRINT
  entity     String   // nama model: "Patient", "CheckupResult", dll
  entityId   String
  oldValue   Json?
  newValue   Json?
  ipAddress  String?
  createdAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}
```

### 11. Notification — TAMBAHAN BARU

```prisma
model Notification {
  id         String   @id @default(cuid())
  patientId  String
  type       String   // EMAIL | WHATSAPP
  subject    String
  message    String
  sentAt     DateTime?
  status     String   // PENDING | SENT | FAILED
  createdAt  DateTime @default(now())

  patient Patient @relation(fields: [patientId], references: [id])
}
```

---

## API Routes yang Dibutuhkan

Buatkan semua endpoint berikut sebagai **Next.js Route Handlers** (`/app/api/`):

### Patients
- `GET /api/patients?page=1&limit=20&search=&status=` — list pasien (pagination + search by name/NIK/no RM)
- `POST /api/patients` — tambah pasien baru (auto-generate medicalRecordNumber)
- `GET /api/patients/[id]` — detail pasien + riwayat MCU
- `PUT /api/patients/[id]` — update data pasien
- `GET /api/patients/search?q=` — cari pasien by name/NIK/no RM (return terbatas, untuk dropdown)

### Checkup Registration
- `GET /api/checkups?page=1&limit=20&date=&status=&patientId=` — list pendaftaran dengan filter
- `POST /api/checkups` — daftarkan pasien MCU baru (dalam transaction: create checkup + billing + queue entries)
- `GET /api/checkups/[id]` — detail checkup + semua hasil pemeriksaan
- `PATCH /api/checkups/[id]/status` — update status (REGISTERED → IN_PROGRESS → COMPLETED)

### Checkup Results
- `GET /api/results/[checkupId]` — ambil semua hasil untuk 1 pendaftaran
- `POST /api/results` — simpan hasil pemeriksaan (auto-flag status berdasarkan normalRange)
- `PUT /api/results/[id]` — update hasil pemeriksaan
- `DELETE /api/results/[id]` — hapus hasil (dengan permission check)

### Reports
- `POST /api/reports` — buat laporan/sertifikat MCU (trigger PDF generation)
- `GET /api/reports/[checkupId]` — get laporan by checkup ID
- `GET /api/reports/[id]/pdf` — download PDF sertifikat

### Billing
- `POST /api/billing` — catat pembayaran (update paymentStatus)
- `GET /api/billing/[checkupId]` — get tagihan
- `PATCH /api/billing/[id]` — update status pembayaran (UNPAID → PAID)

### Queue
- `GET /api/queue?station=LAB&date=2025-01-01` — ambil antrian per stasiun
- `PATCH /api/queue/[id]/call` — panggil pasien (WAITING → CALLED)
- `PATCH /api/queue/[id]/done` — selesai pemeriksaan (CALLED → DONE)

### Dashboard
- `GET /api/dashboard/stats` — jumlah pasien hari ini, pending, selesai, pendapatan

---

## Halaman yang Dibutuhkan

### 1. Dashboard (`/dashboard`)
- Kartu ringkasan: total pasien hari ini, sedang diperiksa, selesai, total pendapatan
- Tabel antrian MCU hari ini (polling tiap 30 detik pakai SWR)
- Grafik jumlah MCU per minggu/bulan (Recharts)

### 2. Pendaftaran MCU (`/dashboard/registration`)
- Form pendaftaran: cari pasien existing (dropdown search) atau input pasien baru (modal/inline)
- Pilih paket MCU (tampilkan harga)
- Pilih tanggal & jadwal
- Konfirmasi & cetak nomor antrian

### 3. Antrian & Stasiun (`/dashboard/checkup`)
- Tampilan antrian per stasiun (Lab, Radiologi, Fisik) — polling real-time
- Filter per stasiun (tab)
- Tombol "Panggil Pasien" / "Selesai" / "Lewati"

### 4. Input Hasil Pemeriksaan (`/dashboard/results`)
- Pilih pasien dari antrian
- List semua jenis pemeriksaan dalam paket yang dipilih pasien
- Input nilai hasil — auto-flag merah (ABNORMAL) jika `valueNumeric` di luar `normalRangeMin/Max`
- Upload file (hasil foto rontgen, EKG, dll)
- Auto-calculate status NORMAL/ABNORMAL/BORDERLINE dari perbandingan numerik

### 5. Laporan & Sertifikat (`/dashboard/reports`)
- Pilih pasien (dari yang sudah COMPLETED)
- Review semua hasil pemeriksaan pasien
- Form kesimpulan dokter & rekomendasi
- Pilih fitness status (FIT / FIT_WITH_NOTES / UNFIT)
- Tombol generate PDF sertifikat MCU
- Preview sertifikat sebelum dicetak/kirim

### 6. Billing (`/dashboard/billing`)
- List pasien yang sudah selesai tapi belum bayar
- Tampilkan rincian tagihan (total paket + diskon)
- Input metode pembayaran, asuransi
- Cetak kwitansi / receipt

---

## Middleware (`/middleware.ts`)

Buat middleware Next.js untuk proteksi route berdasarkan role:

- `/dashboard/*` — semua role kecuali yang tidak login
- `/dashboard/settings/*` — hanya ADMIN
- `/dashboard/billing/*` — CASHIER & ADMIN
- `/dashboard/results/*` — NURSE, DOCTOR, ADMIN
- `/dashboard/reports/*` — DOCTOR, ADMIN
- `/dashboard/registration/*` — RECEPTIONIST, ADMIN

Gunakan `getToken()` dari NextAuth untuk extract session di middleware.

---

## Fitur Tambahan yang Perlu Diimplementasikan

1. **Role-based Access Control** — via middleware + API route check
2. **Nomor RM Auto-generate** — Format: `RM-YYYYMMDD-XXXX` (counter per hari)
3. **Nomor Registrasi Auto-generate** — Format: `MCU-YYYYMMDD-XXXX` (counter per hari)
4. **Auto-flag Hasil Lab** — saat POST/PUT result, bandingkan `valueNumeric` dengan `normalRangeMin/Max` dari ExaminationType, set `status` otomatis
5. **Queue Management** — saat registrasi, buat QueueEntry untuk tiap station yang relevan
6. **Notifikasi** — Setelah laporan selesai, kirim email/WhatsApp ke pasien berisi link download sertifikat
7. **Audit Log** — Catat semua perubahan data (siapa, kapan, apa yang diubah) via helper `lib/audit.ts`
8. **Seed Data** — Seed database dengan paket MCU default, jenis pemeriksaan umum, dan user admin awal

---

## Validasi dengan Zod

Buatkan Zod schema untuk setiap form dengan pesan error bahasa Indonesia:

- `createPatientSchema` — validasi NIK (16 digit), phone, email, name required
- `createCheckupRegistrationSchema` — validasi patientId, mcuPackageId, scheduledDate (tidak boleh backlog)
- `createCheckupResultSchema` — validasi valueNumeric atau valueText sesuai isQuantitative
- `createReportSchema` — validasi doctorConclusion, recommendation, fitnessStatus
- `createBillingSchema` — validasi finalAmount (>= 0), paymentMethod

---

## Environment Variables

Buat file `.env.example`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mcu_db"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# File Upload (UploadThing)
UPLOADTHING_SECRET=""
UPLOADTHING_APP_ID=""

# Atau Cloudinary
# CLOUDINARY_CLOUD_NAME=""
# CLOUDINARY_API_KEY=""
# CLOUDINARY_API_SECRET=""

# Email (Resend)
RESEND_API_KEY=""

# WhatsApp Gateway (Fonnte)
FONNTE_API_KEY=""
```

---

## Hal Penting yang Harus Diperhatikan

- **Cek AGENTS.md** di root proyek — mungkin ada perubahan API di versi Next.js yang terinstall. Baca `node_modules/next/dist/docs/` jika ada.
- Gunakan **Prisma Client singleton** (`lib/prisma.ts`) untuk menghindari koneksi DB berlebihan di Next.js development mode
- Semua API Route harus mengecek **session/auth** sebelum memproses request
- Gunakan **Prisma transactions** (`$transaction`) untuk operasi yang melibatkan beberapa tabel (registrasi → billing → queue)
- Tambahkan **error handling** yang informatif di setiap endpoint (return message bahasa Indonesia)
- Gunakan **select** di Prisma untuk menghindari return data sensitif (seperti password)
- Setiap operasi CRUD yang signifikan harus mencatat **AuditLog** (via `lib/audit.ts`)
- Halaman yang butuh data real-time cukup pakai **SWR dengan polling** (refetch interval 10-30 detik) — hindari WebSocket jika deploy ke Vercel

---

## Output yang Saya Minta

Tolong buatkan (urut prioritas):

1. `prisma/schema.prisma` — schema lengkap dengan semua model, enum, relasi di atas
2. `prisma/seed.ts` — seed data awal: 2 paket MCU, 10 jenis pemeriksaan, 1 user admin
3. `lib/prisma.ts` — Prisma client singleton
4. `lib/auth.ts` — konfigurasi NextAuth v5 dengan Credentials provider + Prisma Adapter
5. `lib/audit.ts` — helper untuk mencatat audit log
6. API Route untuk **patients** (`/app/api/patients/route.ts` dan `/app/api/patients/[id]/route.ts`)
7. API Route untuk **checkups** (`/app/api/checkups/route.ts` dan `/[id]/route.ts`)
8. API Route untuk **results** (`/app/api/results/route.ts`)
9. `middleware.ts` — proteksi route berdasarkan role
10. Halaman **Dashboard** (`/app/(dashboard)/page.tsx`)
11. Halaman **Pendaftaran MCU** (`/app/(dashboard)/registration/page.tsx`)
12. Halaman **Input Hasil** (`/app/(dashboard)/results/page.tsx`)

Jelaskan setiap bagian kode dengan komentar dalam bahasa Indonesia agar mudah saya pahami dan maintain.

---

*Prompt ini dibuat untuk sistem Medical Check-Up rumah sakit. Stack: Next.js 14 (App Router) + Prisma + PostgreSQL + NextAuth + Tailwind + shadcn/ui*
