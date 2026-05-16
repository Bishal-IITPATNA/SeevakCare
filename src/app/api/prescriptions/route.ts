import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { appointmentId, diagnosis, notes, medicines = [], labTests = [] } = await req.json();

  if (!appointmentId || !diagnosis) {
    return NextResponse.json({ error: "appointmentId and diagnosis are required" }, { status: 400 });
  }

  const doctor      = await prisma.doctor.findUnique({ where: { userId: user.id } });
  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });

  if (!doctor || !appointment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const prescription = await prisma.prescription.create({
    data: {
      appointmentId,
      doctorId:  doctor.id,
      patientId: appointment.patientId,
      diagnosis,
      notes,
      medicines: { create: medicines },
      labTests:  { create: labTests },
    },
    include: { medicines: true, labTests: true, patient: { include: { user: true } } },
  });

  await prisma.appointment.update({
    where: { id: appointmentId },
    data:  { status: "COMPLETED" },
  });

  await prisma.notification.create({
    data: {
      userId:  prescription.patient.userId,
      title:   "New Prescription",
      message: `Dr. ${user.name} has issued a prescription for you. Login to view and download.`,
      type:    "APPOINTMENT",
    },
  });

  return NextResponse.json(prescription, { status: 201 });
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.role === "PATIENT") {
    const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
    if (!patient) return NextResponse.json([]);
    const rows = await prisma.prescription.findMany({
      where:   { patientId: patient.id },
      include: {
        doctor:      { include: { user: { select: { name: true } } } },
        medicines:   true,
        labTests:    true,
        appointment: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(rows);
  }

  if (user.role === "DOCTOR") {
    const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
    if (!doctor) return NextResponse.json([]);
    const rows = await prisma.prescription.findMany({
      where:   { doctorId: doctor.id },
      include: {
        patient:   { include: { user: { select: { name: true } } } },
        medicines: true,
        labTests:  true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(rows);
  }

  return NextResponse.json([]);
}
