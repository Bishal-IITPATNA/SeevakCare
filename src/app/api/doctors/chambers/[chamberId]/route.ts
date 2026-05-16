import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

async function ownsChamber(userId: string, chamberId: string) {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) return null;
  const chamber = await prisma.chamber.findFirst({ where: { id: chamberId, doctorId: doctor.id } });
  return chamber;
}

export async function PATCH(req: NextRequest, { params }: { params: { chamberId: string } }) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chamber = await ownsChamber(user.id, params.chamberId);
  if (!chamber) return NextResponse.json({ error: "Chamber not found" }, { status: 404 });

  const { name, address, city, consultationFee } = await req.json();

  const updated = await prisma.chamber.update({
    where: { id: params.chamberId },
    data: {
      name:            name            ?? undefined,
      address:         address         ?? undefined,
      city:            city            ?? undefined,
      consultationFee: consultationFee != null ? Number(consultationFee) : undefined,
    },
    include: { schedules: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { chamberId: string } }) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chamber = await ownsChamber(user.id, params.chamberId);
  if (!chamber) return NextResponse.json({ error: "Chamber not found" }, { status: 404 });

  await prisma.chamberSchedule.deleteMany({ where: { chamberId: params.chamberId } });
  await prisma.chamber.delete({ where: { id: params.chamberId } });

  return NextResponse.json({ message: "Chamber deleted" });
}
