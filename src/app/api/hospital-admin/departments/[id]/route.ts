import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

async function ownsDept(userId: string, deptId: string) {
  const admin = await prisma.hospitalAdmin.findUnique({ where: { userId } });
  if (!admin) return false;
  const dept = await prisma.department.findFirst({ where: { id: deptId, hospitalId: admin.hospitalId } });
  return !!dept;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "HOSPITAL_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await ownsDept(user.id, params.id))) {
    return NextResponse.json({ error: "Department not found" }, { status: 404 });
  }

  const { name, description, totalBeds, occupiedBeds } = await req.json();

  const dept = await prisma.department.update({
    where: { id: params.id },
    data: {
      name:         name         ?? undefined,
      description:  description  ?? undefined,
      totalBeds:    totalBeds    != null ? Number(totalBeds)    : undefined,
      occupiedBeds: occupiedBeds != null ? Number(occupiedBeds) : undefined,
    },
    include: {
      doctors: { include: { doctor: { include: { user: { select: { name: true, email: true } } } } } },
    },
  });

  return NextResponse.json(dept);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "HOSPITAL_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await ownsDept(user.id, params.id))) {
    return NextResponse.json({ error: "Department not found" }, { status: 404 });
  }

  await prisma.departmentDoctor.deleteMany({ where: { departmentId: params.id } });
  await prisma.department.delete({ where: { id: params.id } });

  return NextResponse.json({ message: "Department deleted" });
}
