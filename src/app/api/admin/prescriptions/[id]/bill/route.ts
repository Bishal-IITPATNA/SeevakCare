import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "SYSTEM_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prescription = await prisma.prescription.findUnique({
    where:   { id: params.id },
    include: { bill: true },
  });
  if (!prescription) {
    return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
  }
  if (prescription.bill) {
    return NextResponse.json({ error: "Bill already generated for this prescription" }, { status: 409 });
  }

  const { items } = (await req.json()) as {
    items: { medicineName: string; quantity: number; unitPrice: number }[];
  };

  if (!items?.length) {
    return NextResponse.json({ error: "At least one medicine item is required" }, { status: 400 });
  }

  const subtotal       = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const gstAmount      = parseFloat((subtotal * 0.05).toFixed(2));
  const deliveryCharge = subtotal < 500 ? 50 : parseFloat((subtotal * 0.1).toFixed(2));
  const totalAmount    = parseFloat((subtotal + gstAmount + deliveryCharge).toFixed(2));
  const otpCode        = String(crypto.randomInt(100000, 999999));

  const bill = await prisma.prescriptionBill.create({
    data: {
      prescriptionId: prescription.id,
      patientId:      prescription.patientId,
      subtotal,
      gstAmount,
      deliveryCharge,
      totalAmount,
      otpCode,
      items: {
        create: items.map(i => ({
          medicineName: i.medicineName,
          quantity:     i.quantity,
          unitPrice:    i.unitPrice,
          totalPrice:   parseFloat((i.quantity * i.unitPrice).toFixed(2)),
        })),
      },
    },
    include: { items: true },
  });

  // Notify patient (non-blocking)
  prisma.patient.findUnique({ where: { id: prescription.patientId }, select: { userId: true } })
    .then(patient => {
      if (!patient) return;
      return prisma.notification.create({
        data: {
          userId:  patient.userId,
          title:   "Medicine Bill Ready",
          message: `Your prescription bill of ₹${totalAmount.toFixed(2)} has been generated. OTP for delivery: ${otpCode}`,
          type:    "ORDER",
        },
      });
    })
    .catch(e => console.error("bill notification error:", e));

  return NextResponse.json(bill, { status: 201 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "SYSTEM_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bill = await prisma.prescriptionBill.findUnique({
    where:   { prescriptionId: params.id },
    include: { items: true },
  });

  if (!bill) return NextResponse.json({ error: "No bill found" }, { status: 404 });
  return NextResponse.json(bill);
}
