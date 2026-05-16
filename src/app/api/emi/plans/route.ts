import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find the patient record
  const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
  if (!patient) return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });

  const plans = await prisma.emiPlan.findMany({
    where: {
      payment: {
        OR: [
          { medicineOrder: { patientId: patient.id } },
          { labBooking:    { patientId: patient.id } },
          { appointment:   { patientId: patient.id } },
        ],
      },
    },
    include: {
      installments: { orderBy: { installmentNumber: "asc" } },
      payment: {
        include: {
          medicineOrder: { select: { id: true, totalAmount: true, status: true } },
          labBooking:    { select: { id: true, labTest: { select: { name: true } } } },
          appointment:   { select: { id: true, consultationFee: true, doctor: { select: { user: { select: { name: true } } } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(plans);
}
