import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

async function getAdminHospitalId(userId: string): Promise<string | null> {
  const admin = await prisma.hospitalAdmin.findUnique({ where: { userId } });
  return admin?.hospitalId ?? null;
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "HOSPITAL_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hospitalId = await getAdminHospitalId(user.id);
  if (!hospitalId) return NextResponse.json({ error: "Hospital not found" }, { status: 404 });

  const { name, description, totalBeds } = await req.json();

  if (!name || totalBeds == null) {
    return NextResponse.json({ error: "name and totalBeds are required" }, { status: 400 });
  }

  const dept = await prisma.department.create({
    data: {
      hospitalId,
      name,
      description: description ?? null,
      totalBeds:   Number(totalBeds),
      occupiedBeds: 0,
    },
    include: { doctors: true },
  });

  return NextResponse.json(dept, { status: 201 });
}
