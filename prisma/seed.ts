/**
 * Seed script — Seevak Care
 * Run:  npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" prisma/seed.ts
 *
 * All accounts use password:  Test@1234
 *
 * Accounts created:
 *   patient@seevak.com        — Patient
 *   doctor@seevak.com         — Doctor
 *   hospital@seevak.com       — Hospital Admin
 *   lab@seevak.com            — Lab Store
 *   admin@seevak.com          — System Admin
 */

import { PrismaClient } from "@prisma/client";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const prisma = new PrismaClient();
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf  = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${buf.toString("hex")}`;
}

const PASSWORD = "Test@1234";

async function main() {
  console.log("🌱  Seeding database…");

  const pwHash = await hashPassword(PASSWORD);

  // ─── CLEAN OLD SEED DATA ─────────────────────────────────────────────────
  await prisma.emiInstallment.deleteMany();
  await prisma.emiPlan.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.prescribedMedicine.deleteMany();
  await prisma.prescribedLabTest.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.medicineOrderItem.deleteMany();
  await prisma.medicineOrder.deleteMany();
  await prisma.labBooking.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.departmentDoctor.deleteMany();
  await prisma.department.deleteMany();
  await prisma.chamberSchedule.deleteMany();
  await prisma.chamber.deleteMany();
  await prisma.labTest.deleteMany();
  await prisma.labStore.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.hospitalAdmin.deleteMany();
  await prisma.hospital.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.oTP.deleteMany();
  await prisma.session.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();

  console.log("  ✓ Cleared old data");

  // ─── USERS ────────────────────────────────────────────────────────────────
  const [uPatient, uDoctor, uHospAdmin, uLab, uAdmin] = await Promise.all([
    prisma.user.create({ data: { name: "Priya Sharma",     email: "patient@seevak.com",  phone: "+919876543210", passwordHash: pwHash, role: "PATIENT",        emailVerified: true } }),
    prisma.user.create({ data: { name: "Dr. Arjun Mehta", email: "doctor@seevak.com",   phone: "+919876543211", passwordHash: pwHash, role: "DOCTOR",         emailVerified: true } }),
    prisma.user.create({ data: { name: "Ravi Kapoor",     email: "hospital@seevak.com", phone: "+919876543212", passwordHash: pwHash, role: "HOSPITAL_ADMIN",  emailVerified: true } }),
    prisma.user.create({ data: { name: "Sunita Rao",      email: "lab@seevak.com",      phone: "+919876543213", passwordHash: pwHash, role: "LAB_STORE",       emailVerified: true } }),
    prisma.user.create({ data: { name: "Admin User",      email: "admin@seevak.com",    phone: "+919876543214", passwordHash: pwHash, role: "SYSTEM_ADMIN",    emailVerified: true } }),
  ]);
  console.log("  ✓ Users (5)");

  // ─── PATIENT PROFILE ──────────────────────────────────────────────────────
  const patient = await prisma.patient.create({
    data: {
      userId:      uPatient.id,
      dateOfBirth: new Date("1995-06-15"),
      gender:      "Female",
      bloodGroup:  "B+",
      address:     "42, Shivaji Nagar, Flat 3B",
      city:        "Pune",
      pincode:     "411005",
    },
  });
  console.log("  ✓ Patient profile");

  // ─── DOCTOR & CHAMBERS ───────────────────────────────────────────────────
  const doctor = await prisma.doctor.create({
    data: {
      userId:          uDoctor.id,
      specialization:  "General Physician",
      qualifications:  "MBBS, MD (Internal Medicine)",
      licenseNumber:   "MH-DOC-20451",
      experienceYears: 12,
      bio:             "Senior general physician with 12 years of experience in internal medicine and preventive care.",
      isVerified:      true,
    },
  });

  const chamber = await prisma.chamber.create({
    data: {
      doctorId:        doctor.id,
      name:            "Mehta Clinic — Koregaon Park",
      address:         "15, Lane 6, Koregaon Park",
      city:            "Pune",
      consultationFee: 500,
    },
  });

  // Mon–Fri 09:00–13:00
  for (const day of [1, 2, 3, 4, 5]) {
    await prisma.chamberSchedule.create({
      data: { chamberId: chamber.id, dayOfWeek: day, startTime: "09:00", endTime: "13:00", slotDurationMinutes: 15, maxSlots: 16 },
    });
  }
  // Saturday 10:00–12:00
  await prisma.chamberSchedule.create({
    data: { chamberId: chamber.id, dayOfWeek: 6, startTime: "10:00", endTime: "12:00", slotDurationMinutes: 15, maxSlots: 8 },
  });
  console.log("  ✓ Doctor, chamber & schedules");

  // ─── HOSPITAL ─────────────────────────────────────────────────────────────
  const hospital = await prisma.hospital.create({
    data: {
      name:    "City Care Multi-Speciality Hospital",
      address: "Plot 7, Baner Road",
      city:    "Pune",
      phone:   "+912066554433",
      email:   "info@citycare.in",
      website: "https://citycare.in",
    },
  });

  await prisma.hospitalAdmin.create({ data: { userId: uHospAdmin.id, hospitalId: hospital.id } });

  const [deptCardio, deptOrtho, deptPeds] = await Promise.all([
    prisma.department.create({ data: { hospitalId: hospital.id, name: "Cardiology",   description: "Heart & cardiovascular care", totalBeds: 20, occupiedBeds: 12 } }),
    prisma.department.create({ data: { hospitalId: hospital.id, name: "Orthopaedics", description: "Bone, joint & spine care",    totalBeds: 15, occupiedBeds: 8  } }),
    prisma.department.create({ data: { hospitalId: hospital.id, name: "Paediatrics",  description: "Child healthcare (0–18 yrs)", totalBeds: 10, occupiedBeds: 4  } }),
  ]);

  await prisma.departmentDoctor.create({ data: { departmentId: deptCardio.id, doctorId: doctor.id } });
  console.log("  ✓ Hospital, admin & departments");

  // ─── LAB STORE & TESTS ───────────────────────────────────────────────────
  const labStore = await prisma.labStore.create({
    data: {
      userId:               uLab.id,
      name:                 "HealthFirst Diagnostics",
      address:              "Shop 12, Aundh Market",
      city:                 "Pune",
      phone:                "+912065432100",
      isVerified:           true,
      homeCollection:       true,
      homeCollectionCharge: 80,
    },
  });

  const [ltCBC, ltLFT, ltSugar, ltThyroid, ltUrine] = await Promise.all([
    prisma.labTest.create({ data: { labStoreId: labStore.id, name: "Complete Blood Count (CBC)",   price: 299, sampleType: "Blood", turnaroundHours: 4,  description: "Full haematology panel" } }),
    prisma.labTest.create({ data: { labStoreId: labStore.id, name: "Liver Function Test (LFT)",    price: 549, sampleType: "Blood", turnaroundHours: 8,  description: "Liver enzyme & protein panel" } }),
    prisma.labTest.create({ data: { labStoreId: labStore.id, name: "Fasting Blood Sugar",          price: 149, sampleType: "Blood", turnaroundHours: 2,  description: "Glucose test — 12h fasting required" } }),
    prisma.labTest.create({ data: { labStoreId: labStore.id, name: "Thyroid Profile (T3/T4/TSH)", price: 699, sampleType: "Blood", turnaroundHours: 12, description: "Complete thyroid panel" } }),
    prisma.labTest.create({ data: { labStoreId: labStore.id, name: "Urine Routine & Microscopy",  price: 199, sampleType: "Urine", turnaroundHours: 3,  description: "Complete urine analysis" } }),
  ]);
  console.log("  ✓ Lab store & 5 tests");

  // ─── MEDICINES ────────────────────────────────────────────────────────────
  const [med0, med1, med2, med3, med4, med5, med6, med7, med8, med9] =
    await Promise.all([
      prisma.medicine.create({ data: { name: "Paracetamol 500mg",     genericName: "Paracetamol",     manufacturer: "Sun Pharma",  category: "Analgesic",     price: 22,  unit: "strip",  stock: 500, requiresPrescription: false } }),
      prisma.medicine.create({ data: { name: "Amoxicillin 500mg",     genericName: "Amoxicillin",     manufacturer: "Cipla",       category: "Antibiotic",    price: 85,  unit: "strip",  stock: 200, requiresPrescription: true  } }),
      prisma.medicine.create({ data: { name: "Omeprazole 20mg",       genericName: "Omeprazole",      manufacturer: "Dr. Reddy's", category: "Antacid",       price: 45,  unit: "strip",  stock: 300, requiresPrescription: false } }),
      prisma.medicine.create({ data: { name: "Cetirizine 10mg",       genericName: "Cetirizine",      manufacturer: "Mankind",     category: "Antihistamine", price: 18,  unit: "strip",  stock: 400, requiresPrescription: false } }),
      prisma.medicine.create({ data: { name: "Metformin 500mg",       genericName: "Metformin",       manufacturer: "USV",         category: "Antidiabetic",  price: 38,  unit: "strip",  stock: 250, requiresPrescription: true  } }),
      prisma.medicine.create({ data: { name: "Atorvastatin 10mg",     genericName: "Atorvastatin",    manufacturer: "Lupin",       category: "Cardiac",       price: 65,  unit: "strip",  stock: 180, requiresPrescription: true  } }),
      prisma.medicine.create({ data: { name: "Azithromycin 500mg",    genericName: "Azithromycin",    manufacturer: "Cipla",       category: "Antibiotic",    price: 110, unit: "strip",  stock: 150, requiresPrescription: true  } }),
      prisma.medicine.create({ data: { name: "Vitamin D3 60000 IU",   genericName: "Cholecalciferol", manufacturer: "Abbott",      category: "Supplement",    price: 42,  unit: "bottle", stock: 600, requiresPrescription: false } }),
      prisma.medicine.create({ data: { name: "Ibuprofen 400mg",       genericName: "Ibuprofen",       manufacturer: "Pfizer",      category: "NSAID",         price: 28,  unit: "strip",  stock: 350, requiresPrescription: false } }),
      prisma.medicine.create({ data: { name: "Pantoprazole 40mg",     genericName: "Pantoprazole",    manufacturer: "Torrent",     category: "Antacid",       price: 55,  unit: "strip",  stock: 280, requiresPrescription: false } }),
    ]);
  console.log("  ✓ Medicines (10)");

  // ─── APPOINTMENTS ─────────────────────────────────────────────────────────
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const lastWeek = new Date(); lastWeek.setDate(lastWeek.getDate() - 7);
  const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);

  // 1. ACCEPTED — patient can pay consultation fee now
  const apptAccepted = await prisma.appointment.create({
    data: {
      patientId:       patient.id,
      doctorId:        doctor.id,
      chamberId:       chamber.id,
      appointmentDate: tomorrow,
      slotTime:        "10:00",
      status:          "ACCEPTED",
      reason:          "Routine check-up and blood pressure monitoring",
      consultationFee: 500,
    },
  });

  // 2. PENDING — awaiting doctor acceptance
  await prisma.appointment.create({
    data: {
      patientId:       patient.id,
      doctorId:        doctor.id,
      chamberId:       chamber.id,
      appointmentDate: nextWeek,
      slotTime:        "11:00",
      status:          "PENDING",
      reason:          "Fever and body ache for 3 days",
      consultationFee: 500,
    },
  });

  // 3. COMPLETED + paid (hospital)
  const apptCompleted = await prisma.appointment.create({
    data: {
      patientId:       patient.id,
      hospitalId:      hospital.id,
      departmentId:    deptCardio.id,
      appointmentDate: lastWeek,
      slotTime:        "09:30",
      status:          "COMPLETED",
      reason:          "Chest discomfort evaluation",
      consultationFee: 800,
    },
  });

  await prisma.payment.create({
    data: {
      razorpayOrderId:   "order_dummy_appt_001",
      razorpayPaymentId: "pay_dummy_appt_001",
      razorpaySignature: "sig_dummy_appt_001",
      amount:            800,
      status:            "SUCCESS",
      appointmentId:     apptCompleted.id,
    },
  });
  console.log("  ✓ Appointments (3)");

  // ─── PRESCRIPTION (for completed appointment) ─────────────────────────────
  await prisma.prescription.create({
    data: {
      appointmentId: apptCompleted.id,
      doctorId:      doctor.id,
      patientId:     patient.id,
      diagnosis:     "Hypertension Grade I + Vitamin D Deficiency",
      notes:         "Patient advised lifestyle modification, low-sodium diet, daily 30-min walk.",
      medicines: {
        create: [
          { medicineName: "Amlodipine 5mg",      dosage: "5mg",       frequency: "0-0-1", duration: "30 days", instructions: "Take at bedtime"              },
          { medicineName: "Vitamin D3 60000 IU", dosage: "60000 IU",  frequency: "0-1-0", duration: "8 weeks", instructions: "Once weekly after breakfast"  },
        ],
      },
      labTests: {
        create: [
          { testName: "Complete Blood Count (CBC)", instructions: "Fasting not required"       },
          { testName: "Lipid Profile",               instructions: "12-hour fasting required"  },
        ],
      },
    },
  });
  console.log("  ✓ Prescription");

  // ─── MEDICINE ORDERS ──────────────────────────────────────────────────────
  // 1. PAYMENT_PENDING — patient can pay right now (key test case)
  await prisma.medicineOrder.create({
    data: {
      patientId:       patient.id,
      subtotal:        190,
      gstAmount:       9.50,
      deliveryCharge:  50,
      totalAmount:     249.50,
      status:          "PAYMENT_PENDING",
      deliveryAddress: "42, Shivaji Nagar, Flat 3B",
      deliveryCity:    "Pune",
      deliveryPincode: "411005",
      otpCode:         "847291",
      otpVerified:     false,
      items: {
        create: [
          { medicineId: med0.id, quantity: 3, unitPrice: 22 },
          { medicineId: med2.id, quantity: 2, unitPrice: 45 },
          { medicineId: med3.id, quantity: 2, unitPrice: 18 },
        ],
      },
    },
  });

  // 2. PENDING_APPROVAL — awaiting admin
  await prisma.medicineOrder.create({
    data: {
      patientId:       patient.id,
      subtotal:        280,
      gstAmount:       14,
      deliveryCharge:  50,
      totalAmount:     344,
      status:          "PENDING_APPROVAL",
      deliveryAddress: "42, Shivaji Nagar, Flat 3B",
      deliveryCity:    "Pune",
      deliveryPincode: "411005",
      otpCode:         "312904",
      otpVerified:     false,
      items: {
        create: [
          { medicineId: med1.id, quantity: 2, unitPrice: 85  },
          { medicineId: med6.id, quantity: 1, unitPrice: 110 },
        ],
      },
    },
  });

  // 3. DELIVERED + paid (history)
  const orderDelivered = await prisma.medicineOrder.create({
    data: {
      patientId:       patient.id,
      subtotal:        130,
      gstAmount:       6.50,
      deliveryCharge:  50,
      totalAmount:     186.50,
      status:          "DELIVERED",
      deliveryAddress: "42, Shivaji Nagar, Flat 3B",
      deliveryCity:    "Pune",
      deliveryPincode: "411005",
      otpCode:         "556123",
      otpVerified:     true,
      trackingNumber:  "TRK-2026-00142",
      items: {
        create: [
          { medicineId: med7.id, quantity: 2, unitPrice: 42 },
          { medicineId: med9.id, quantity: 1, unitPrice: 55 },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      razorpayOrderId:   "order_dummy_med_001",
      razorpayPaymentId: "pay_dummy_med_001",
      razorpaySignature: "sig_dummy_med_001",
      amount:            186.50,
      status:            "SUCCESS",
      medicineOrderId:   orderDelivered.id,
    },
  });

  // 4. DISPATCHED (in transit, OTP not yet confirmed)
  await prisma.medicineOrder.create({
    data: {
      patientId:        patient.id,
      subtotal:         500,
      gstAmount:        25,
      deliveryCharge:   50,
      totalAmount:      575,
      status:           "DISPATCHED",
      deliveryAddress:  "42, Shivaji Nagar, Flat 3B",
      deliveryCity:     "Pune",
      deliveryPincode:  "411005",
      otpCode:          "778812",
      otpVerified:      false,
      trackingNumber:   "TRK-2026-00189",
      estimatedDelivery: tomorrow,
      items: {
        create: [
          { medicineId: med4.id, quantity: 5, unitPrice: 38 },
          { medicineId: med5.id, quantity: 4, unitPrice: 65 },
        ],
      },
    },
  });
  console.log("  ✓ Medicine orders (4)");

  // ─── LAB BOOKINGS ─────────────────────────────────────────────────────────
  // 1. OTP verified + PENDING — patient can pay right now
  await prisma.labBooking.create({
    data: {
      patientId:        patient.id,
      labStoreId:       labStore.id,
      labTestId:        ltCBC.id,
      collectionType:   "HOME",
      collectionAddress:"42, Shivaji Nagar, Flat 3B, Pune 411005",
      scheduledDate:    tomorrow,
      status:           "PENDING",
      otpCode:          "963412",
      otpVerified:      true,
    },
  });

  // 2. PENDING — OTP not verified yet (patient needs to verify first)
  await prisma.labBooking.create({
    data: {
      patientId:      patient.id,
      labStoreId:     labStore.id,
      labTestId:      ltSugar.id,
      collectionType: "LAB",
      scheduledDate:  nextWeek,
      status:         "PENDING",
      otpCode:        "124578",
      otpVerified:    false,
    },
  });

  // 3. CONFIRMED + paid
  const labConfirmed = await prisma.labBooking.create({
    data: {
      patientId:        patient.id,
      labStoreId:       labStore.id,
      labTestId:        ltThyroid.id,
      collectionType:   "HOME",
      collectionAddress:"42, Shivaji Nagar, Flat 3B, Pune 411005",
      scheduledDate:    lastWeek,
      status:           "CONFIRMED",
      otpCode:          "741852",
      otpVerified:      true,
    },
  });

  await prisma.payment.create({
    data: {
      razorpayOrderId:   "order_dummy_lab_001",
      razorpayPaymentId: "pay_dummy_lab_001",
      razorpaySignature: "sig_dummy_lab_001",
      amount:            699,
      status:            "SUCCESS",
      labBookingId:      labConfirmed.id,
    },
  });

  // 4. REPORT_UPLOADED + paid
  const labReported = await prisma.labBooking.create({
    data: {
      patientId:      patient.id,
      labStoreId:     labStore.id,
      labTestId:      ltLFT.id,
      collectionType: "LAB",
      scheduledDate:  lastWeek,
      status:         "REPORT_UPLOADED",
      reportUrl:      "https://example.com/reports/lft-priya-2026.pdf",
      otpCode:        "852369",
      otpVerified:    true,
    },
  });

  await prisma.payment.create({
    data: {
      razorpayOrderId:   "order_dummy_lab_002",
      razorpayPaymentId: "pay_dummy_lab_002",
      razorpaySignature: "sig_dummy_lab_002",
      amount:            549,
      status:            "SUCCESS",
      labBookingId:      labReported.id,
    },
  });
  console.log("  ✓ Lab bookings (4)");

  // ─── NOTIFICATIONS ────────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { userId: uPatient.id, title: "Order Approved",        message: "Your medicine order has been approved and is ready for payment.", type: "ORDER",       isRead: false },
      { userId: uPatient.id, title: "Appointment Accepted",  message: "Dr. Arjun Mehta has accepted your appointment for tomorrow at 10:00.", type: "APPOINTMENT", isRead: false },
      { userId: uPatient.id, title: "Lab Booking Confirmed", message: "Your CBC test is confirmed. Sample collection tomorrow.", type: "LAB",         isRead: true  },
      { userId: uPatient.id, title: "Payment Successful",    message: "Payment of ₹186.50 for medicine order was successful.", type: "PAYMENT",     isRead: true  },
      { userId: uDoctor.id,  title: "New Appointment",       message: "Priya Sharma has requested an appointment for tomorrow at 10:00.", type: "APPOINTMENT", isRead: false },
      { userId: uLab.id,     title: "New Lab Booking",       message: "A patient has booked CBC test for home collection tomorrow.", type: "LAB", isRead: false },
    ],
  });
  console.log("  ✓ Notifications");

  // ─── SUMMARY ──────────────────────────────────────────────────────────────
  console.log("\n✅  Seed complete!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  🔑  Password for ALL accounts:  Test@1234");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Patient        →  patient@seevak.com");
  console.log("  Doctor         →  doctor@seevak.com");
  console.log("  Hospital Admin →  hospital@seevak.com");
  console.log("  Lab Store      →  lab@seevak.com");
  console.log("  System Admin   →  admin@seevak.com");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  What you can test as patient:");
  console.log("  💊  My Orders  → 1 PAYMENT_PENDING order  (pay now)");
  console.log("  💊  My Orders  → 1 DISPATCHED order       (OTP shown)");
  console.log("  💊  My Orders  → 1 DELIVERED order        (history)");
  console.log("  🧪  Lab Tests  → 1 OTP-verified booking   (pay now)");
  console.log("  🧪  Lab Tests  → 1 unverified booking     (verify OTP first)");
  console.log("  🧪  Lab Tests  → 1 report uploaded        (download PDF)");
  console.log("  📅  Appoints  → 1 ACCEPTED               (pay fee)");
  console.log("  📅  Appoints  → 1 PENDING                (awaiting doctor)");
  console.log("  📋  Rx         → 1 prescription from completed appt");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
