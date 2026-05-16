import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { calculateMedicinePricing } from "@/lib/utils/pricing";
import crypto from "crypto";

// Generate a simple 6-digit delivery OTP (not emailed — shown in app)
function generateDeliveryOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "PATIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
  if (!patient) return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });

  // Generate delivery OTP — shown to patient in app, confirmed by delivery person
  const deliveryOTP = generateDeliveryOTP();

  const order = await prisma.medicineOrder.create({
    data: {
      patientId:      patient.id,
      subtotal:       pricing.subtotal,
      gstAmount:      pricing.gstAmount,
      deliveryCharge: pricing.deliveryCharge,
      totalAmount:    pricing.totalAmount,
      deliveryAddress,
      deliveryCity,
      deliveryPincode,
      otpCode:    deliveryOTP,
      otpVerified: false,       // verified at delivery time, not now
      items: {
        create: items.map((i: any) => ({
          medicineId: i.medicineId,
          quantity:   i.quantity,
          unitPrice:  i.unitPrice,
        })),
      },
    },
  });

  return NextResponse.json(
    {
      orderId:     order.id,
      pricing,
      deliveryOTP, // shown in app to patient — keep safe, share only at door
      message:     "Order placed. Show the OTP to the delivery person when medicines arrive.",
    },
    { status: 201 }
  );
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.role === "PATIENT") {
    const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
    if (!patient) return NextResponse.json([]);
    const rows = await prisma.medicineOrder.findMany({
      where:   { patientId: patient.id },
      include: { items: { include: { medicine: true } }, payment: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(rows);
  }

  if (user.role === "SYSTEM_ADMIN") {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as any;
    const rows = await prisma.medicineOrder.findMany({
      where:   status ? { status } : {},
      include: {
        items:   { include: { medicine: true } },
        patient: { include: { user: { select: { name: true, email: true, phone: true } } } },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(rows);
  }

  return NextResponse.json([]);
}
