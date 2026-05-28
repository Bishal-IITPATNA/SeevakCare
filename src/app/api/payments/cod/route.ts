import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { referenceId } = await req.json();
  if (!referenceId) return NextResponse.json({ error: "referenceId is required" }, { status: 400 });

  // Verify patient owns this order
  const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
  if (!patient) return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });

  const order = await prisma.medicineOrder.findUnique({ where: { id: referenceId } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.patientId !== patient.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (order.status !== "PAYMENT_PENDING") {
    return NextResponse.json({ error: "Order is not ready for payment" }, { status: 400 });
  }

  // Idempotency: reject if a non-failed payment already exists
  const existing = await prisma.payment.findFirst({
    where: { medicineOrderId: referenceId, status: { not: "FAILED" } },
  });
  if (existing) {
    return NextResponse.json({ error: "A payment already exists for this order" }, { status: 409 });
  }

  // Create COD payment record and move order to dispatch queue
  const codOrderId = `COD_${referenceId.slice(-8)}_${Date.now()}`;

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        razorpayOrderId: codOrderId,
        amount:          order.totalAmount,
        currency:        "INR",
        status:          "PENDING", // Cash collected at doorstep
        medicineOrderId: referenceId,
      },
    }),
    prisma.medicineOrder.update({
      where: { id: referenceId },
      data:  { status: "PAID" }, // Moves to admin dispatch queue
    }),
  ]);

  return NextResponse.json({ success: true, method: "COD" });
}
