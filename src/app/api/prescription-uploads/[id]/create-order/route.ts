import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { calculateMedicinePricing } from "@/lib/utils/pricing";
import crypto from "crypto";

function generateDeliveryOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "SYSTEM_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const upload = await prisma.prescriptionUpload.findUnique({
    where:   { id: params.id },
    include: { patient: true },
  });
  if (!upload) return NextResponse.json({ error: "Prescription upload not found" }, { status: 404 });
  if (upload.status === "ORDERED") {
    return NextResponse.json({ error: "Order already created for this prescription" }, { status: 409 });
  }
  if (upload.status === "REJECTED") {
    return NextResponse.json({ error: "Cannot create order for a rejected prescription" }, { status: 400 });
  }

  const { items, deliveryAddress, deliveryCity, deliveryPincode } = await req.json();

  if (!items?.length || !deliveryAddress || !deliveryCity || !deliveryPincode) {
    return NextResponse.json(
      { error: "items, deliveryAddress, deliveryCity, and deliveryPincode are required" },
      { status: 400 }
    );
  }

  const subtotal = items.reduce(
    (sum: number, i: any) => sum + Number(i.unitPrice) * Number(i.quantity),
    0
  );
  const pricing = calculateMedicinePricing(subtotal);
  const deliveryOTP = generateDeliveryOTP();

  const order = await prisma.medicineOrder.create({
    data: {
      patientId:           upload.patient.id,
      subtotal:            pricing.subtotal,
      gstAmount:           pricing.gstAmount,
      deliveryCharge:      pricing.deliveryCharge,
      totalAmount:         pricing.totalAmount,
      deliveryAddress,
      deliveryCity,
      deliveryPincode,
      otpCode:             deliveryOTP,
      otpVerified:         false,
      // Admin-created orders skip PENDING_APPROVAL and go straight to PAYMENT_PENDING
      status:              "PAYMENT_PENDING",
      prescriptionUploadId: upload.id,
      items: {
        create: items.map((i: any) => ({
          medicineId: i.medicineId,
          quantity:   i.quantity,
          unitPrice:  i.unitPrice,
        })),
      },
    },
  });

  await prisma.prescriptionUpload.update({
    where: { id: params.id },
    data:  { status: "ORDERED" },
  });

  await prisma.notification.create({
    data: {
      userId:  upload.patient.userId,
      title:   "Medicine Order Created",
      message: `Admin has created a medicine order from your prescription. Please proceed to payment.`,
      type:    "ORDER",
    },
  });

  return NextResponse.json({ orderId: order.id, pricing, deliveryOTP }, { status: 201 });
}
