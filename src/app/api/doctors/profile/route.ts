import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const doctor = await prisma.doctor.findUnique({
    where: { userId: user.id },
    include: {
      user:     { select: { name: true, email: true, phone: true } },
      chambers: { include: { schedules: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!doctor) return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });

  return NextResponse.json(doctor);
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { specialization, qualifications, experienceYears, bio, name, phone } = await req.json();

  const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
  if (!doctor) return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.doctor.update({
      where: { userId: user.id },
      data: {
        specialization:  specialization  ?? undefined,
        qualifications:  qualifications  ?? undefined,
        experienceYears: experienceYears != null ? Number(experienceYears) : undefined,
        bio:             bio             ?? undefined,
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

  return NextResponse.json({ message: "Profile updated" });
}
