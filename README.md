# SwiftCare

A telehealth web application built for the Whitecloak Launchpad Builder Round (May 26–30, 2026). SwiftCare connects patients with doctors for virtual consultations, prescription management, and ongoing care — all in a clean, premium interface.

---

## Overview

SwiftCare has two primary modules:

- **Patient Module** — register, find doctors by specialty or symptoms (AI-powered), book and join consultations, view medical records and prescriptions
- **Doctor Module** — manage availability, conduct virtual consultations, write notes and prescriptions, view patient history

---

## Test Accounts

> Run the seed endpoint once before testing to create all accounts:
> `GET /api/seed/test-accounts` — then `POST /api/seed/test-accounts` to populate consultations and health records.

| Role | Email | Password |
|---|---|---|
| Patient | patient@test.com | Test1234! |
| Doctor | doctor@test.com | Test1234! |

All 29 seeded doctors are also accessible via `doctor@test.com`. The patient account (`patient@test.com`) comes pre-loaded with consultation history and health records after running the POST seed.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (Nova preset) |
| Database | MongoDB Atlas (Mongoose ODM) |
| Auth | NextAuth.js v4 (Credentials provider, JWT sessions) |
| File Uploads | UploadThing |
| Real-time | Pusher |
| Video Calls | Daily.co embed |
| AI Feature | Anthropic Claude API (doctor recommendation) |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 20.9+
- A MongoDB Atlas cluster (free M0 tier works)
- Accounts for: Pusher, UploadThing, Daily.co, Anthropic

### 1. Clone and install

```bash
git clone <repo-url>
cd swiftcare
npm install
```

### 2. Set up environment variables

Copy `.env.local` (already provided) and fill in your actual values:

```bash
# .env.local is already present — add your secrets
```

See [Environment Variables](#environment-variables) below for what each one does.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Seed the database (optional)

```bash
npm run seed
```

This populates 29 doctors across 15+ specializations, a patient account, and sample consultations and health records.

---

## Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `NEXTAUTH_SECRET` | Random secret for signing JWT sessions (use `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Base URL of the app (`http://localhost:3000` for dev) |
| `UPLOADTHING_SECRET` | UploadThing API secret |
| `UPLOADTHING_APP_ID` | UploadThing app ID |
| `PUSHER_APP_ID` | Pusher app ID (server-side) |
| `PUSHER_KEY` | Pusher key (server-side) |
| `PUSHER_SECRET` | Pusher secret (server-side) |
| `PUSHER_CLUSTER` | Pusher cluster (e.g. `ap1`) |
| `NEXT_PUBLIC_PUSHER_KEY` | Pusher key (client-side) |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Pusher cluster (client-side) |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key for doctor recommendation feature |

---

## Folder Structure

```
swiftcare/
├── public/
│   ├── fonts/              # Apercu Pro font files
│   └── illustrations/      # SVG illustrations for empty/success states
├── src/
│   ├── app/
│   │   ├── login/              # Shared login page (patients + doctors)
│   │   ├── register/           # Registration — role selected on this page
│   │   ├── patient/
│   │   │   ├── (app)/
│   │   │   │   ├── layout.tsx          # Patient dashboard shell (sidebar + header)
│   │   │   │   ├── dashboard/          # Patient home — upcoming consultations, AI chat
│   │   │   │   ├── doctors/            # Browse and search doctors, book consultations
│   │   │   │   ├── consultations/      # View, reschedule, cancel consultations
│   │   │   │   │   └── [id]/waiting-room/  # Pre-session waiting room
│   │   │   │   └── records/            # Health records — prescriptions, notes, labs, certs, referrals
│   │   ├── doctor/
│   │   │   ├── (app)/
│   │   │   │   ├── layout.tsx          # Doctor dashboard shell
│   │   │   │   ├── dashboard/          # Doctor home — today's schedule, earnings
│   │   │   │   └── consultations/      # Manage all consultations, add notes, view records
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/     # NextAuth handler
│   │   │   ├── patient/
│   │   │   │   ├── appointments/       # Book, list, patch appointments
│   │   │   │   ├── doctors/            # Doctor listing and search
│   │   │   │   └── records/            # Health records endpoints
│   │   │   ├── doctor/
│   │   │   │   └── consultations/      # Doctor consultation management + records
│   │   │   ├── seed/
│   │   │   │   ├── test-accounts/      # GET: seed 29 doctors + patient; POST: seed consultations + records; PATCH: seed doctor consultations
│   │   │   │   └── health-records/     # Seed health records
│   │   │   └── uploadthing/            # File upload handler
│   │   ├── globals.css
│   │   ├── layout.tsx      # Root layout
│   │   ├── template.tsx    # Page transition wrapper (animate-pageIn)
│   │   └── page.tsx        # Landing page (redirects authenticated users)
│   ├── components/
│   │   ├── auth/           # RegisterStep1–3, LoginForm
│   │   ├── landing/        # LandingPage
│   │   ├── patient/
│   │   │   ├── booking/    # BookingModal, BookingStep1–3, RescheduleModal
│   │   │   ├── consultations/  # ConsultationsPage, ConsultationCard, CancelModal
│   │   │   ├── dashboard/  # DashboardHome, UpcomingAppointmentCard, SwiftChat, HeroSearch
│   │   │   ├── doctors/    # FindDoctorsPage, DoctorCard, DoctorDrawer
│   │   │   └── records/    # HealthRecordsPage
│   │   └── doctor/
│   │       ├── consultations/  # DoctorConsultationCard, AddNotesModal, ViewRecordsModal
│   │       ├── dashboard/  # DoctorDashboard
│   │       └── profile/    # DoctorProfileModal
│   ├── lib/
│   │   ├── db.ts           # MongoDB connection (Mongoose, hot-reload safe)
│   │   ├── auth.ts         # NextAuth options
│   │   └── utils.ts        # cn() helper
│   ├── models/
│   │   ├── User.ts
│   │   ├── PatientProfile.ts
│   │   ├── DoctorProfile.ts
│   │   ├── Appointment.ts
│   │   ├── HealthRecord.ts
│   │   └── Notification.ts
│   ├── types/
│   │   ├── consultation.ts
│   │   ├── doctor.ts
│   │   └── next-auth.d.ts
│   └── proxy.ts            # Route protection (Next.js 16 — replaces middleware.ts)
├── .env.local
├── BRIEF.md
├── CLAUDE.md
├── DESIGN-SYSTEM.md
├── FUTURE-IMPROVEMENTS.md
└── package.json
```

---

## Notes

- **Font:** Apercu Pro is used as the primary typeface. Font files must be manually exported from Font Book and placed in `public/fonts/`. The app falls back to Inter if unavailable.
- **Middleware:** Next.js 16 renames `middleware.ts` to `proxy.ts` — this project uses the new convention.
- **Video calls:** Virtual consultations use Daily.co embed — no custom WebRTC implementation.
- **Auth:** Patients and doctors share the same `/login` page and are redirected to their respective dashboards based on their `role` field in the JWT.

---

## Deadline

May 30, 2026 — Whitecloak Launchpad Builder Round
