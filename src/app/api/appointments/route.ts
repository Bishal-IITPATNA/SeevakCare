import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { sendEmail, appointmentNotificationEmail } from "@/lib/utils/email";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as any;

  if (user.role === "PATIENT") {
    const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
    if (!patient) return NextResponse.json([]);
    const rows = await prisma.appointment.findMany({
      where: { patientId: patient.id, ...(status ? { status } : {}) },
      include: {
        doctor:     { include: { user: { select: { name: true, email: true } } } },
        hospital:   true,
        chamber:    true,
        department: true,
        payment:    true,
      },
      orderBy: { appointmentDate: "desc" },
    });
    return NextResponse.json(rows);
  }

  if (user.role === "DOCTOR") {
    const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
    if (!doctor) return NextResponse.json([]);
    const rows = await prisma.appointment.findMany({
      where: { doctorId: doctor.id, ...(status ? { status } : {}) },
      include: {
        patient: { include: { user: { select: { name: true, email: true, phone: true } } } },
        chamber: true,
        payment: true,
      },
      orderBy: { appointmentDate: "desc" },
    });
    return NextResponse.json(rows);
  }

  if (user.role === "HOSPITAL_ADMIN") {
    const admin = await prisma.hospitalAdmin.findUnique({
      where: { userId: user.id },
      include: { hospital: true },
    });
    if (!admin) return NextResponse.json([]);
    const rows = await prisma.appointment.findMany({
      where: { hospitalId: admin.hospitalId, ...(status ? { status } : {}) },
      include: {
        patient:    { include: { user: { select: { name: true } } } },
        department: true,
        payment:    true,
      },
      orderBy: { appointmentDate: "desc" },
    });
    return NextResponse.json(rows);
  }

  if (user.role === "SYSTEM_ADMIN") {
    const rows = await prisma.appointment.findMany({
      include: {
        patient: { include: { user: { select: { name: true } } } },
        doctor:  { include: { user: { select: { name: true } } } },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(rows);
  }

  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "PATIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    doctorId, chamberId, hospitalId, departmentId,
    appointmentDate, slotTime, reason, consultationFee,
  } = await req.json();

  if (!appointmentDate || !slotTime) {
    return NextResponse.json({ error: "Date and slot time are required" }, { status: 400 });
  }

  const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
  if (!patient) return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });

  // Duplicate-booking guard: same patient + same slot already exists and is not cancelled/declined
  const duplicate = await prisma.appointment.findFirst({
    where: {
      patientId:       patient.id,
      appointmentDate: new Date(appointmentDate),
      slotTime,
      ...(doctorId    ? { doctorId }    : {}),
      ...(hospitalId  ? { hospitalId }  : {}),
      ...(chamberId   ? { chamberId }   : {}),
      status: { notIn: ["CANCELLED", "DECLINED"] },
    },
  });
  if (duplicate) {
    return NextResponse.json(
      { error: "You already have an appointment booked for this date and time." },
      { status: 409 }
    );
  }

  // Validate slot against doctor's chamber schedule
  if (chamberId) {
    const date = new Date(appointmentDate);
    const dayOfWeek = date.getDay(); // 0=Sun … 6=Sat

    const schedule = await prisma.chamberSchedule.findFirst({
      where: { chamberId, dayOfWeek },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Doctor is not available on this day. Please choose a different date." },
        { status: 400 }
      );
    }

    // Compare slotTime ("HH:MM") against schedule start/end times
    const toMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const slot  = toMinutes(slotTime);
    const start = toMinutes(schedule.startTime);
    const end   = toMinutes(schedule.endTime);

    if (slot < start || slot >= end) {
      return NextResponse.json(
        { error: `Doctor is only available ${schedule.startTime}–${schedule.endTime} on this day.` },
        { status: 400 }
      );
    }
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId:    doctorId    || null,
      chamberId:   chamberId   || null,
      hospitalId:  hospitalId  || null,
      departmentId: departmentId || null,
      appointmentDate: new Date(appointmentDate),
      slotTime,
      reason,
      consultationFee: consultationFee ? consultationFee : null,
    },
    include: { doctor: { include: { user: true } } },
  });

  // Notify doctor
  if (appointment.doctor) {
    await prisma.notification.create({
      data: {
        userId:  appointment.doctor.userId,
        title:   "New Appointment Request",
        message: `${user.name} has requested an appointment on ${new Date(appointmentDate).toDateString()} at ${slotTime}.`,
        type:    "APPOINTMENT",
      },
    });
  }

  return NextResponse.json(appointment, { status: 201 });
}
