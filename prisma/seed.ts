import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Seevak Care database...");

  // System Admin
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@seevakcare.com" },
    update: {},
    create: { name: "System Admin", email: "admin@seevakcare.com", role: "SYSTEM_ADMIN", emailVerified: true },
  });
  console.log("Admin created:", adminUser.email);

  // Doctor
  const docUser = await prisma.user.upsert({
    where: { email: "dr.priya@seevakcare.com" },
    update: {},
    create: { name: "Dr. Priya Sharma", email: "dr.priya@seevakcare.com", role: "DOCTOR", emailVerified: true, phone: "+919876543210" },
  });

  await prisma.doctor.upsert({
    where: { userId: docUser.id },
    update: {},
    create: {
      userId: docUser.id,
      specialization: "Cardiology",
      qualifications: "MBBS, MD (Cardiology)",
      licenseNumber: "MCI-CAR-12345",
      experienceYears: 12,
      bio: "Senior cardiologist with expertise in interventional cardiology and heart failure management.",
      isVerified: true,
      chambers: {
        create: [
          {
            name: "Heart Care Clinic",
            address: "14 Park Street",
            city: "Kolkata",
            consultationFee: 800,
            schedules: {
              create: [
                { dayOfWeek: 1, startTime: "09:00", endTime: "13:00", slotDurationMinutes: 15, maxSlots: 16 },
                { dayOfWeek: 3, startTime: "15:00", endTime: "19:00", slotDurationMinutes: 15, maxSlots: 16 },
                { dayOfWeek: 5, startTime: "09:00", endTime: "12:00", slotDurationMinutes: 15, maxSlots: 12 },
              ],
            },
          },
        ],
      },
    },
  });
  console.log("Doctor seeded:", docUser.email);

  // Patient
  const patUser = await prisma.user.upsert({
    where: { email: "patient@seevakcare.com" },
    update: {},
    create: { name: "Rahul Verma", email: "patient@seevakcare.com", role: "PATIENT", emailVerified: true, phone: "+919123456789" },
  });

  await prisma.patient.upsert({
    where: { userId: patUser.id },
    update: {},
    create: {
      userId: patUser.id,
      gender: "Male",
      bloodGroup: "O+",
      address: "42 Lake Road",
      city: "Kolkata",
      pincode: "700029",
    },
  });
  console.log("Patient seeded:", patUser.email);

  // Hospital
  const hospital = await prisma.hospital.upsert({
    where: { id: "hosp-001" },
    update: {},
    create: {
      id: "hosp-001",
      name: "Seevak General Hospital",
      address: "1 Hospital Road, Salt Lake",
      city: "Kolkata",
      phone: "+913322334455",
      email: "info@seevakhospital.com",
      website: "https://seevakhospital.com",
    },
  });

  await prisma.department.createMany({
    skipDuplicates: true,
    data: [
      { hospitalId: hospital.id, name: "Cardiology",    totalBeds: 20, occupiedBeds: 12 },
      { hospitalId: hospital.id, name: "Orthopedics",   totalBeds: 15, occupiedBeds: 8  },
      { hospitalId: hospital.id, name: "Neurology",     totalBeds: 10, occupiedBeds: 6  },
      { hospitalId: hospital.id, name: "Pediatrics",    totalBeds: 25, occupiedBeds: 10 },
      { hospitalId: hospital.id, name: "General Surgery", totalBeds: 30, occupiedBeds: 18 },
    ],
  });
  console.log("Hospital + departments seeded");

  // Lab Store
  const labUser = await prisma.user.upsert({
    where: { email: "lab@seevakcare.com" },
    update: {},
    create: { name: "Seevak Diagnostics", email: "lab@seevakcare.com", role: "LAB_STORE", emailVerified: true },
  });

  const labStore = await prisma.labStore.upsert({
    where: { userId: labUser.id },
    update: {},
    create: {
      userId: labUser.id,
      name: "Seevak Diagnostics Centre",
      address: "88 Science Park",
      city: "Kolkata",
      phone: "+913322112233",
      isVerified: true,
      homeCollection: true,
      homeCollectionCharge: 150,
    },
  });

  await prisma.labTest.createMany({
    skipDuplicates: true,
    data: [
      { labStoreId: labStore.id, name: "Complete Blood Count (CBC)",  price: 350,  sampleType: "Blood",  turnaroundHours: 6,  instructions: "No special preparation needed." },
      { labStoreId: labStore.id, name: "Blood Glucose (Fasting)",     price: 150,  sampleType: "Blood",  turnaroundHours: 4,  instructions: "Fast for 8 hours before the test." },
      { labStoreId: labStore.id, name: "Lipid Profile",               price: 550,  sampleType: "Blood",  turnaroundHours: 12, instructions: "Fast for 12 hours before the test." },
      { labStoreId: labStore.id, name: "Thyroid Function (TSH, T3, T4)", price: 800, sampleType: "Blood", turnaroundHours: 24, instructions: "No special preparation needed." },
      { labStoreId: labStore.id, name: "Urine Routine & Microscopy",  price: 200,  sampleType: "Urine", turnaroundHours: 4,  instructions: "Collect midstream urine in the morning." },
      { labStoreId: labStore.id, name: "HbA1c (Glycated Haemoglobin)", price: 450, sampleType: "Blood",  turnaroundHours: 12, instructions: "No fasting required." },
      { labStoreId: labStore.id, name: "Liver Function Test (LFT)",   price: 600,  sampleType: "Blood",  turnaroundHours: 12, instructions: "No alcohol 24 hours before test." },
      { labStoreId: labStore.id, name: "ECG",                         price: 250,  sampleType: "None",   turnaroundHours: 1,  instructions: "Walk-in test, no preparation needed." },
    ],
  });
  console.log("Lab store + tests seeded");

  // Medicines
  await prisma.medicine.createMany({
    skipDuplicates: true,
    data: [
      { name: "Paracetamol 500mg",    genericName: "Paracetamol",      manufacturer: "Cipla",   category: "Analgesic",     price: 25,   unit: "strip", stock: 500 },
      { name: "Amoxicillin 500mg",    genericName: "Amoxicillin",      manufacturer: "Sun Pharma", category: "Antibiotic", price: 85,   unit: "strip", stock: 300, requiresPrescription: true },
      { name: "Metformin 500mg",      genericName: "Metformin HCl",    manufacturer: "Dr. Reddy", category: "Antidiabetic", price: 45,  unit: "strip", stock: 400, requiresPrescription: true },
      { name: "Atorvastatin 10mg",    genericName: "Atorvastatin",     manufacturer: "Cipla",   category: "Lipid-lowering", price: 120, unit: "strip", stock: 200, requiresPrescription: true },
      { name: "Vitamin D3 1000IU",    genericName: "Cholecalciferol",  manufacturer: "Abbott",  category: "Supplement",   price: 180,  unit: "bottle", stock: 150 },
      { name: "Omeprazole 20mg",      genericName: "Omeprazole",       manufacturer: "Sun Pharma", category: "Antacid",   price: 55,  unit: "strip", stock: 350 },
      { name: "Cetirizine 10mg",      genericName: "Cetirizine HCl",   manufacturer: "Mankind", category: "Antiallergic", price: 30,  unit: "strip", stock: 600 },
      { name: "Azithromycin 500mg",   genericName: "Azithromycin",     manufacturer: "Cipla",   category: "Antibiotic",   price: 95,  unit: "strip", stock: 250, requiresPrescription: true },
    ],
  });
  console.log("Medicines seeded");

  console.log("\n✅ Seevak Care seed complete!");
  console.log("Login credentials (OTP-based — send OTP from the app):");
  console.log("  Admin   : admin@seevakcare.com");
  console.log("  Doctor  : dr.priya@seevakcare.com");
  console.log("  Patient : patient@seevakcare.com");
  console.log("  Lab     : lab@seevakcare.com");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
