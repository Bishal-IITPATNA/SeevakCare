import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
  if (!doctor) return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

  const chambers = await prisma.chamber.findMany({
    where:   { doctorId: doctor.id },
    include: { schedules: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(chambers);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, address, city, consultationFee } = await req.json();

  if (!name || !address || !city || consultationFee == null) {
    return NextResponse.json({ error: "name, address, city and consultationFee are required" }, { status: 400 });
  }

  const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
  if (!doctor) return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

  const chamber = await prisma.chamber.create({
    data: { doctorId: doctor.id, name, address, city, consultationFee: Number(consultationFee) },
    include: { schedules: true },
  });

  return NextResponse.json(chamber, { status: 201 });
}
