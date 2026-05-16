import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "PATIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
  if (!patient) return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const notes = (formData.get("notes") as string) || "";

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, WEBP, or PDF files are allowed" }, { status: 400 });
  }

  const maxSize = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: "File size must be under 5 MB" }, { status: 400 });
  }

  const ext = file.name.split(".").pop();
  const fileName = `${patient.id}_${Date.now()}.${ext}`;
  const filePath = path.join(process.cwd(), "public", "uploads", "prescriptions", fileName);

  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  const upload = await prisma.prescriptionUpload.create({
    data: {
      patientId: patient.id,
      fileUrl:   `/uploads/prescriptions/${fileName}`,
      fileName:  file.name,
      notes,
    },
  });

  return NextResponse.json(upload, { status: 201 });
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.role === "PATIENT") {
    const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
    if (!patient) return NextResponse.json([]);
    const uploads = await prisma.prescriptionUpload.findMany({
      where:   { patientId: patient.id },
      include: { medicineOrders: { select: { id: true, status: true, totalAmount: true, createdAt: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(uploads);
  }

  if (user.role === "SYSTEM_ADMIN") {
    const uploads = await prisma.prescriptionUpload.findMany({
      include: {
        patient:        { include: { user: { select: { name: true, email: true, phone: true } } } },
        medicineOrders: { select: { id: true, status: true, totalAmount: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(uploads);
  }

  return NextResponse.json([]);
}
