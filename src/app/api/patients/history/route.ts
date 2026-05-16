import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "PATIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  const appointments = await prisma.appointment.findMany({
    where: {
      patientId: patient.id,
      status:    { in: ["COMPLETED", "CANCELLED"] },
    },
    include: {
      doctor: {
        include: { user: { select: { name: true } } },
      },
      chamber: { select: { name: true, city: true } },
      hospital: { select: { name: true, city: true } },
      department: { select: { name: true } },
      prescription: {
        include: {
          medicines: true,
          labTests:  true,
        },
      },
    },
    orderBy: { appointmentDate: "desc" },
  });

  const labBookings = await prisma.labBooking.findMany({
    where: {
      patientId: patient.id,
      status:    { in: ["REPORT_UPLOADED", "CANCELLED"] },
    },
    include: {
      labTest:  true,
      labStore: { select: { name: true, city: true } },
    },
    orderBy: { scheduledDate: "desc" },
  });

  return NextResponse.json({ appointments, labBookings });
}
