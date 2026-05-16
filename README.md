# 🏥 Seevak Care — Complete Healthcare Management Platform

A **production-ready** full-stack healthcare application built with **Next.js 14**, **Neon (Postgres)**, **Prisma ORM**, **Razorpay**, and email OTP authentication.

**Support:** seevakcare@gmail.com | +91 97713 65160

---

## 📁 Project Structure

```
seevak-care/
├── prisma/
│   ├── schema.prisma          ← All DB models (21 tables)
│   └── seed.ts                ← Sample data seed script
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/         ← OTP login page
│   │   │   ├── register/      ← Registration with role selection
│   │   │   └── forgot-password/
│   │   ├── dashboard/
│   │   │   ├── patient/       ← Patient dashboard
│   │   │   ├── doctor/        ← Doctor dashboard
│   │   │   ├── hospital-admin/← Hospital admin dashboard
│   │   │   ├── lab-store/     ← Lab store dashboard
│   │   │   └── system-admin/  ← Admin dashboard + analytics
│   │   ├── api/
│   │   │   ├── auth/          ← send-otp, verify-otp, register, me, logout
│   │   │   ├── appointments/  ← CRUD + status update
│   │   │   ├── prescriptions/ ← Issue + view
│   │   │   ├── medicine-orders/ ← Order + OTP verify + admin approve + tracking
│   │   │   ├── lab-bookings/  ← Book + OTP verify + status update
│   │   │   ├── payments/      ← Razorpay create-order + verify
│   │   │   ├── doctors/search/← Search with filters
│   │   │   ├── medicines/     ← Catalog + admin manage
│   │   │   ├── admin/analytics/ ← Revenue + totals + charts
│   │   │   └── notifications/ ← In-app notifications
│   │   ├── layout.tsx
│   │   └── page.tsx           ← Landing page
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── StatsGrid.tsx
│   │   ├── RazorpayButton.tsx ← Universal payment component
│   │   ├── BookDoctor.tsx     ← Search + book flow
│   │   ├── PrescribeMedicine.tsx ← Doctor prescribing UI
│   │   ├── cards/
│   │   │   ├── AppointmentCard.tsx
│   │   │   ├── MedicineOrderCard.tsx ← OTP + payment inline
│   │   │   └── LabBookingCard.tsx    ← OTP + payment inline
│   │   └── sidebars/
│   │       ├── PatientSidebar.tsx
│   │       └── DoctorSidebar.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── razorpay.ts
│   │   └── utils/
│   │       ├── pricing.ts     ← GST + delivery logic
│   │       ├── otp.ts         ← Generate + verify
│   │       ├── email.ts       ← Nodemailer + HTML templates
│   │       └── pdf.tsx        ← @react-pdf/renderer prescriptions
│   ├── middleware.ts           ← Route protection
│   └── globals.css            ← Tailwind + custom classes
├── Dockerfile
├── docker-compose.yml
├── vercel.json
├── .github/workflows/deploy.yml
└── .env.example
```

---

## ⚡ Quick Start

### 1. Clone and install

```bash
git clone https://github.com/yourorg/seevak-care.git
cd seevak-care
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local with your Neon URL, Razorpay keys, SMTP credentials
```

### 3. Set up Neon database

1. Create a free project at [neon.tech](https://neon.tech)
2. Copy the **pooled** connection string → `DATABASE_URL`
3. Copy the **direct** connection string → `DIRECT_URL`

```bash
npx prisma db push       # creates all tables
npx prisma db seed       # seeds sample data
```

### 4. Run locally

```bash
npm run dev
# → http://localhost:3000
```

---

## 🗄️ Database Models

| Model | Purpose |
|---|---|
| `User` | Auth — all roles share this |
| `Session` | HTTP-only cookie session tokens |
| `OTP` | Multi-purpose OTP codes |
| `Patient` | Patient profile |
| `Doctor` | Doctor profile with license, specialization |
| `Chamber` | Doctor's clinic/chamber |
| `ChamberSchedule` | Day-wise availability |
| `Hospital` | Hospital entity |
| `HospitalAdmin` | Links User → Hospital |
| `Department` | Hospital dept with bed tracking |
| `DepartmentDoctor` | Many-to-many doctors ↔ departments |
| `Appointment` | Doctor or hospital appointment |
| `Prescription` | Doctor's prescription after appointment |
| `PrescribedMedicine` | Medicine line items |
| `PrescribedLabTest` | Lab test line items |
| `LabStore` | Diagnostic centre entity |
| `LabTest` | Test catalog with price |
| `LabBooking` | Patient books a lab test |
| `Medicine` | Medicine catalog |
| `MedicineOrder` | Patient medicine order |
| `MedicineOrderItem` | Line items |
| `Payment` | Razorpay payment record |
| `Notification` | In-app notifications |

---

## 💊 Medicine Pricing Logic

```
Subtotal  = Σ(item.price × quantity)
GST       = Subtotal × 5%
Delivery  = ₹50              if Subtotal < ₹500
          = Subtotal × 10%   if Subtotal ≥ ₹500
Total     = Subtotal + GST + Delivery
```

File: `src/lib/utils/pricing.ts`

---

## 🔐 Authentication & OTP Flows

### Login (passwordless)
```
1. POST /api/auth/send-otp   { email, purpose: "LOGIN" }
2. User gets 6-digit code via email (expires in 10 min)
3. POST /api/auth/verify-otp { email, code, purpose }
4. Server creates session → sets HTTP-only cookie
5. GET /api/auth/me  → returns user with role
6. Redirect to /dashboard/<role>
```

### Forgot Password
```
1. POST /api/auth/send-otp   { purpose: "FORGOT_PASSWORD" }
2. Verify OTP → identity confirmed → let user reset
```

### Medicine Order Confirmation
```
1. POST /api/medicine-orders → OTP auto-sent
2. POST /api/medicine-orders/:id/verify-otp { otp }
3. Admin approves → status: PAYMENT_PENDING
4. Patient pays via Razorpay
```

### Lab Booking Confirmation
```
1. POST /api/lab-bookings → OTP auto-sent
2. POST /api/lab-bookings/:id/verify-otp { otp }
3. Patient pays via Razorpay → status: CONFIRMED
```

---

## 💳 Razorpay Payment Flow

```
Client                        Server                    Razorpay
  │                              │                          │
  │── POST /api/payments/        │                          │
  │      create-order ──────────►│                          │
  │                              │── Create Razorpay Order ►│
  │                              │◄── { orderId, amount } ──│
  │◄── { key, orderId, amount } ─│                          │
  │                              │                          │
  │── Opens Razorpay Checkout ───────────────────────────► │
  │◄── { paymentId, signature } ─────────────────────────  │
  │                              │                          │
  │── POST /api/payments/verify ►│                          │
  │                              │── HMAC verify            │
  │                              │── Update DB status       │
  │◄── { message: "Payment verified" }                      │
```

File: `src/lib/razorpay.ts` + `src/components/RazorpayButton.tsx`

---

## 📋 End-to-End Workflows

### Workflow 1: Patient Books Doctor Appointment
```
1. Patient searches doctors  GET /api/doctors/search?q=cardiology&city=Kolkata
2. Patient selects doctor + chamber + date + slot
3. POST /api/appointments → status: PENDING
4. Doctor gets notification (DB + email)
5. Doctor PATCH /api/appointments/:id/status { status: "ACCEPTED" }
6. Patient gets email notification
7. Patient pays consultation fee via Razorpay
8. Doctor marks completed → issues prescription
```

### Workflow 2: Patient Orders Medicine
```
1. Patient browses GET /api/medicines
2. Adds to cart → calculates GST + delivery
3. POST /api/medicine-orders → OTP sent to patient email
4. POST /api/medicine-orders/:id/verify-otp  (OTP verified)
5. Admin sees in dashboard → approves order
6. Patient gets email → proceeds to Razorpay payment
7. Payment verified → status: PAID
8. Admin updates tracking → DISPATCHED → DELIVERED
9. Patient gets notification at each step
```

### Workflow 3: Patient Books Lab Test
```
1. Patient browses lab tests
2. Selects test, date, collection type (HOME or LAB)
3. POST /api/lab-bookings → OTP sent
4. POST /api/lab-bookings/:id/verify-otp
5. Patient pays via Razorpay → status: CONFIRMED
6. Lab collects sample → SAMPLE_COLLECTED
7. Lab uploads report URL → REPORT_UPLOADED
8. Patient gets email → downloads PDF report
```

---

## 🚀 Deployment

### Option A: Vercel (Recommended)

```bash
npm i -g vercel
vercel login
vercel --prod
```

**Set environment variables in Vercel Dashboard → Settings → Environment Variables:**
```
DATABASE_URL
DIRECT_URL
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
NEXT_PUBLIC_RAZORPAY_KEY_ID
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
SUPPORT_EMAIL=seevakcare@gmail.com
SUPPORT_PHONE=+919771365160
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### Option B: Docker

```bash
# Build image
docker build -t seevak-care .

# Run with compose (includes local Postgres)
docker-compose up -d

# Run migrations in container
docker exec seevak-care npx prisma migrate deploy
docker exec seevak-care npx prisma db seed
```

### Neon Production Setup

1. Go to [neon.tech](https://neon.tech) → New Project → `seevakcare`
2. Enable **Connection Pooling**
3. Copy pooled URL → `DATABASE_URL`
4. Copy direct URL → `DIRECT_URL`

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooled (app runtime)
  directUrl = env("DIRECT_URL")     // direct (migrations)
}
```

---

## 📬 Email Setup

### SendGrid (Recommended — 100 free/day)
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxx
SMTP_FROM=noreply@seevakcare.com
```

### Gmail (Dev only)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seevakcare@gmail.com
SMTP_PASS=<app-password>   # Google Account → App Passwords
SMTP_FROM=seevakcare@gmail.com
```

---

## 📄 PDF Generation

Uses `@react-pdf/renderer` for server-side PDF generation.

```tsx
// In a Server Component or API route:
import { renderToBuffer } from "@react-pdf/renderer";
import { PrescriptionPDF } from "@/lib/utils/pdf";

const buffer = await renderToBuffer(<PrescriptionPDF prescription={data} />);
// Save to S3/Cloudinary and store URL in prescription.pdfUrl
```

---

## 🔒 Security Checklist

- [x] OTP expires in 10 minutes, single-use, invalidated on re-send
- [x] Session tokens are HTTP-only, Secure, SameSite cookies
- [x] Razorpay HMAC-SHA256 signature verified server-side
- [x] Role-based API guards on every endpoint
- [x] Prisma parameterized queries (no SQL injection)
- [x] No sensitive env vars exposed to client (`NEXT_PUBLIC_` only for key_id)
- [x] Middleware protects all `/dashboard/*` routes
- [ ] Add `@upstash/ratelimit` on OTP endpoints (recommended)
- [ ] Enable Neon Row Level Security for multi-tenant isolation
- [ ] Add CSRF token for sensitive mutations

---

## 🔔 Notification Events

| Event | Channel | Recipient |
|---|---|---|
| New appointment request | DB + Email | Doctor |
| Appointment accepted/declined | DB + Email | Patient |
| Prescription issued | DB | Patient |
| Medicine order confirmed (OTP) | Email | Patient |
| Medicine order approved by admin | DB + Email | Patient |
| Order dispatched | DB | Patient |
| Order delivered | DB | Patient |
| Lab booking confirmed | DB | Patient |
| Sample collected | DB | Patient |
| Lab report ready | DB + Email | Patient |
| Payment success | DB | Patient |

---

## 👥 Role → Dashboard Routing

| Role | Dashboard | Permissions |
|---|---|---|
| `PATIENT` | `/dashboard/patient` | Book, view own records, pay |
| `DOCTOR` | `/dashboard/doctor` | Accept/decline, prescribe |
| `HOSPITAL_ADMIN` | `/dashboard/hospital-admin` | Departments, beds, appts |
| `LAB_STORE` | `/dashboard/lab-store` | Bookings, sample, reports |
| `SYSTEM_ADMIN` | `/dashboard/system-admin` | All data, approve orders, analytics |

---

## 🧪 Seed Data (Demo Login)

After `npm run db:seed`, use these accounts (OTP login):

| Role | Email |
|---|---|
| System Admin | admin@seevakcare.com |
| Doctor | dr.priya@seevakcare.com |
| Patient | patient@seevakcare.com |
| Lab Store | lab@seevakcare.com |

---

## 📦 Key Dependencies

```
next@14                — App Router framework
prisma@5               — ORM + Neon adapter
razorpay@2             — Payment gateway SDK
nodemailer@6           — SMTP email
@react-pdf/renderer@3  — PDF generation
tailwindcss@3          — Utility CSS
typescript@5           — Type safety
```

---

## 📞 Support

- Email: [seevakcare@gmail.com](mailto:seevakcare@gmail.com)
- Phone: [+91 97713 65160](tel:+919771365160)
