import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

async function ownsChamber(userId: string, chamberId: string) {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) return false;
  const chamber = await prisma.chamber.findFirst({ where: { id: chamberId, doctorId: doctor.id } });
  return !!chamber;
}

export async function POST(req: NextRequest, { params }: { params: { chamberId: string } }) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await ownsChamber(user.id, params.chamberId))) {
    return NextResponse.json({ error: "Chamber not found" }, { status: 404 });
  }

  const { dayOfWeek, startTime, endTime, slotDurationMinutes, maxSlots } = await req.json();

  if (dayOfWeek == null || !startTime || !endTime) {
    return NextResponse.json({ error: "dayOfWeek, startTime and endTime are required" }, { status: 400 });
  }

  // Replace existing schedule for the same day to avoid duplicates
  await prisma.chamberSchedule.deleteMany({
    where: { chamberId: params.chamberId, dayOfWeek: Number(dayOfWeek) },
  });

  const schedule = await prisma.chamberSchedule.create({
    data: {
      chamberId:           params.chamberId,
      dayOfWeek:           Number(dayOfWeek),
      startTime,
      endTime,
      slotDurationMinutes: slotDurationMinutes ? Number(slotDurationMinutes) : 15,
      maxSlots:            maxSlots            ? Number(maxSlots)            : 20,
    },
  });

  return NextResponse.json(schedule, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: { chamberId: string } }) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await ownsChamber(user.id, params.chamberId))) {
    return NextResponse.json({ error: "Chamber not found" }, { status: 404 });
  }

  const { scheduleId } = await req.json();
  if (!scheduleId) return NextResponse.json({ error: "scheduleId required" }, { status: 400 });

  await prisma.chamberSchedule.delete({ where: { id: scheduleId } });

  return NextResponse.json({ message: "Schedule deleted" });
}
