import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "SYSTEM_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payments = await prisma.payment.findMany({
    include: {
      appointment: {
        include: {
          patient: { include: { user: { select: { name: true, email: true, phone: true } } } },
          doctor:  { include: { user: { select: { name: true } } } },
          hospital: { select: { name: true } },
        },
      },
      medicineOrder: {
        include: {
          patient: { include: { user: { select: { name: true, email: true, phone: true } } } },
        },
      },
      labBooking: {
        include: {
          patient: { include: { user: { select: { name: true, email: true, phone: true } } } },
          labTest:  { select: { name: true } },
          labStore: { select: { name: true } },
        },
      },
      emiPlan: { select: { tenureMonths: true, monthlyEmi: true, totalPayable: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
    take:    300,
  });

  return NextResponse.json(payments);
}
