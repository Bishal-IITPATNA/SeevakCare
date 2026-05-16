import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.role === "HOSPITAL_ADMIN") {
    const admin = await prisma.hospitalAdmin.findUnique({
      where: { userId: user.id },
      include: {
        hospital: {
          include: {
            departments: {
              include: {
                doctors: { include: { doctor: { include: { user: { select: { name: true, email: true } } } } } },
              },
              orderBy: { name: "asc" },
            },
          },
        },
      },
    });
    if (!admin) return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    return NextResponse.json(admin.hospital);
  }

  if (user.role === "SYSTEM_ADMIN") {
    const hospitals = await prisma.hospital.findMany({
      include: { departments: true },
    });
    return NextResponse.json(hospitals);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "HOSPITAL_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.hospitalAdmin.findUnique({ where: { userId: user.id } });
  if (!admin) return NextResponse.json({ error: "Hospital not found" }, { status: 404 });

  const { name, address, city, phone, email, website } = await req.json();

  const hospital = await prisma.hospital.update({
    where: { id: admin.hospitalId },
    data: {
      name:    name    ?? undefined,
      address: address ?? undefined,
      city:    city    ?? undefined,
      phone:   phone   ?? undefined,
      email:   email   ?? undefined,
      website: website ?? undefined,
    },
  });

  return NextResponse.json(hospital);
}
