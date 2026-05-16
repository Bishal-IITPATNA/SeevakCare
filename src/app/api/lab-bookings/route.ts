import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { generateOTP } from "@/lib/utils/otp";
import { sendEmail, otpEmailTemplate } from "@/lib/utils/email";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "PATIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { labTestId, labStoreId, collectionType, collectionAddress, scheduledDate } = await req.json();

  if (!labTestId || !labStoreId || !scheduledDate) {
    return NextResponse.json({ error: "labTestId, labStoreId, and scheduledDate are required" }, { status: 400 });
  }

  const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
  if (!patient) return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });

  const booking = await prisma.labBooking.create({
    data: {
      patientId:  patient.id,
      labTestId,
      labStoreId,
      collectionType:    collectionType ?? "LAB",
      collectionAddress: collectionAddress ?? null,
      scheduledDate:     new Date(scheduledDate),
    },
  });

  const otp = await generateOTP(user.id, user.email, "LAB_BOOKING");
  await sendEmail({
    to:      user.email,
    subject: "Seevak Care — Confirm your lab test booking",
    html:    otpEmailTemplate(user.name, otp, "LAB_BOOKING"),
  });
  await prisma.labBooking.update({ where: { id: booking.id }, data: { otpCode: otp } });

  return NextResponse.json({ bookingId: booking.id, message: "OTP sent to your email" }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.role === "PATIENT") {
    const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
    if (!patient) return NextResponse.json([]);
    const rows = await prisma.labBooking.findMany({
      where:   { patientId: patient.id },
      include: { labTest: true, labStore: true, payment: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(rows);
  }

  if (user.role === "LAB_STORE") {
    const lab = await prisma.labStore.findUnique({ where: { userId: user.id } });
    if (!lab) return NextResponse.json([]);
    const rows = await prisma.labBooking.findMany({
      where:   { labStoreId: lab.id },
      include: {
        labTest: true,
        patient: { include: { user: { select: { name: true, email: true, phone: true } } } },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(rows);
  }

  if (user.role === "SYSTEM_ADMIN") {
    const rows = await prisma.labBooking.findMany({
      include: {
        labTest:  true,
        labStore: true,
        patient:  { include: { user: { select: { name: true } } } },
        payment:  true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(rows);
  }

  return NextResponse.json([]);
}
