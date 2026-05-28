import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

async function getAdminHospitalId(userId: string): Promise<string | null> {
  const admin = await prisma.hospitalAdmin.findUnique({ where: { userId } });
  return admin?.hospitalId ?? null;
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "HOSPITAL_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hospitalId = await getAdminHospitalId(user.id);
  if (!hospitalId) return NextResponse.json({ error: "Hospital not found" }, { status: 404 });

  try {
    const services = await prisma.hospitalService.findMany({
      where: { hospitalId },
      include: { department: { select: { id: true, name: true } } },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(services);
  } catch (err) {
    console.error("[hospital-admin/services] DB error:", err);
    return NextResponse.json({ error: "Failed to load services. Schema may be out of sync." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "HOSPITAL_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hospitalId = await getAdminHospitalId(user.id);
  if (!hospitalId) return NextResponse.json({ error: "Hospital not found" }, { status: 404 });

  const body = await req.json();
  const {
    name, description, category, subcategory, price, gstPercent,
    departmentId, admissionDays,
    includes, excludes,
    preOpInstructions, postOpInstructions,
    paymentTerms, cancellationPolicy, additionalTerms,
  } = body;

  if (!name || !category || price == null) {
    return NextResponse.json({ error: "name, category and price are required" }, { status: 400 });
  }

  if (departmentId) {
    const dept = await prisma.department.findFirst({ where: { id: departmentId, hospitalId } });
    if (!dept) return NextResponse.json({ error: "Department not found" }, { status: 400 });
  }

  const service = await prisma.hospitalService.create({
    data: {
      hospitalId,
      departmentId: departmentId || null,
      name,
      description:        description        ?? null,
      category,
      subcategory:        subcategory        ?? "",
      price:              Number(price),
      gstPercent:         gstPercent != null  ? Number(gstPercent) : 0,
      admissionDays:      admissionDays != null ? Number(admissionDays) : 0,
      includes:           includes           ?? "",
      excludes:           excludes           ?? "",
      preOpInstructions:  preOpInstructions  ?? null,
      postOpInstructions: postOpInstructions ?? null,
      paymentTerms:       paymentTerms       ?? null,
      cancellationPolicy: cancellationPolicy ?? null,
      additionalTerms:    additionalTerms    ?? null,
    },
    include: { department: { select: { id: true, name: true } } },
  });

  return NextResponse.json(service, { status: 201 });
}
