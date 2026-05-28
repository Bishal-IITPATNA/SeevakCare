import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

async function ownsService(userId: string, serviceId: string): Promise<boolean> {
  const admin = await prisma.hospitalAdmin.findUnique({ where: { userId } });
  if (!admin) return false;
  const svc = await prisma.hospitalService.findFirst({ where: { id: serviceId, hospitalId: admin.hospitalId } });
  return !!svc;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "HOSPITAL_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await ownsService(user.id, params.id))) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const body = await req.json();
  const {
    name, description, category, subcategory, price, gstPercent,
    departmentId, admissionDays, isActive,
    includes, excludes,
    preOpInstructions, postOpInstructions,
    paymentTerms, cancellationPolicy, additionalTerms,
  } = body;

  const service = await prisma.hospitalService.update({
    where: { id: params.id },
    data: {
      name:               name               ?? undefined,
      description:        description        ?? undefined,
      category:           category           ?? undefined,
      subcategory:        subcategory        ?? undefined,
      price:              price != null       ? Number(price)       : undefined,
      gstPercent:         gstPercent != null  ? Number(gstPercent)  : undefined,
      departmentId:       "departmentId" in body ? (departmentId || null) : undefined,
      admissionDays:      admissionDays != null ? Number(admissionDays) : undefined,
      isActive:           isActive           ?? undefined,
      includes:           includes           ?? undefined,
      excludes:           excludes           ?? undefined,
      preOpInstructions:  preOpInstructions  ?? undefined,
      postOpInstructions: postOpInstructions ?? undefined,
      paymentTerms:       paymentTerms       ?? undefined,
      cancellationPolicy: cancellationPolicy ?? undefined,
      additionalTerms:    additionalTerms    ?? undefined,
    },
    include: { department: { select: { id: true, name: true } } },
  });

  return NextResponse.json(service);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "HOSPITAL_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await ownsService(user.id, params.id))) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  await prisma.hospitalService.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Service deleted" });
}
