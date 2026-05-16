import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "PATIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const patient = await prisma.patient.findUnique({
    where: { userId: user.id },
    include: { user: { select: { name: true, email: true, phone: true } } },
  });

  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  return NextResponse.json(patient);
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "PATIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { dateOfBirth, gender, bloodGroup, address, city, pincode, name, phone } = await req.json();

  const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

  const [updatedPatient] = await prisma.$transaction([
    prisma.patient.update({
      where: { userId: user.id },
      data: {
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender:      gender      ?? undefined,
        bloodGroup:  bloodGroup  ?? undefined,
        address:     address     ?? undefined,
        city:        city        ?? undefined,
        pincode:     pincode     ?? undefined,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        name:  name  ?? undefined,
        phone: phone ?? undefined,
      },
    }),
  ]);

  return NextResponse.json(updatedPatient);
}
