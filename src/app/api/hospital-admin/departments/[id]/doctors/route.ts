import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

async function ownsDept(userId: string, deptId: string) {
  const admin = await prisma.hospitalAdmin.findUnique({ where: { userId } });
  if (!admin) return false;
  const dept = await prisma.department.findFirst({ where: { id: deptId, hospitalId: admin.hospitalId } });
  return !!dept;
}

// Assign a doctor to this department
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "HOSPITAL_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await ownsDept(user.id, params.id))) {
    return NextResponse.json({ error: "Department not found" }, { status: 404 });
  }

  const { doctorId } = await req.json();
  if (!doctorId) return NextResponse.json({ error: "doctorId required" }, { status: 400 });

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) return NextResponse.json({ error: "Doctor not found" }, { status: 404 });

  const link = await prisma.departmentDoctor.upsert({
    where: { departmentId_doctorId: { departmentId: params.id, doctorId } },
    update: {},
    create: { departmentId: params.id, doctorId },
  });

  return NextResponse.json(link, { status: 201 });
}

// Remove a doctor from this department
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "HOSPITAL_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await ownsDept(user.id, params.id))) {
    return NextResponse.json({ error: "Department not found" }, { status: 404 });
  }

  const { doctorId } = await req.json();
  if (!doctorId) return NextResponse.json({ error: "doctorId required" }, { status: 400 });

  await prisma.departmentDoctor.deleteMany({
    where: { departmentId: params.id, doctorId },
  });

  return NextResponse.json({ message: "Doctor removed from department" });
}
