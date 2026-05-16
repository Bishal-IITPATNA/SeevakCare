import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { createRazorpayOrder } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, referenceId } = await req.json();
  // type: "MEDICINE_ORDER" | "LAB_BOOKING" | "APPOINTMENT"

  let amountINR = 0;
  let receipt   = "";

  if (type === "MEDICINE_ORDER") {
    const order = await prisma.medicineOrder.findUnique({ where: { id: referenceId } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (!order.otpVerified) return NextResponse.json({ error: "OTP not verified for this order" }, { status: 400 });
    if (order.status !== "PAYMENT_PENDING") return NextResponse.json({ error: "Order is not in payment-pending state" }, { status: 400 });
    amountINR = parseFloat(order.totalAmount.toString());
    receipt   = `med_${referenceId.slice(-8)}`;

  } else if (type === "LAB_BOOKING") {
    const booking = await prisma.labBooking.findUnique({ where: { id: referenceId }, include: { labTest: true } });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (!booking.otpVerified) return NextResponse.json({ error: "OTP not verified for this booking" }, { status: 400 });
    amountINR = parseFloat(booking.labTest.price.toString());
    receipt   = `lab_${referenceId.slice(-8)}`;

  } else if (type === "APPOINTMENT") {
    const appt = await prisma.appointment.findUnique({ where: { id: referenceId } });
    if (!appt) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    amountINR = parseFloat(appt.consultationFee?.toString() ?? "0");
    receipt   = `appt_${referenceId.slice(-8)}`;

  } else {
    return NextResponse.json({ error: "Invalid payment type" }, { status: 400 });
  }

  if (amountINR <= 0) return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });

  const rzpOrder = await createRazorpayOrder(amountINR, receipt);

  const payment = await prisma.payment.create({
    data: {
      razorpayOrderId: rzpOrder.id,
      amount:          amountINR,
      ...(type === "MEDICINE_ORDER" ? { medicineOrderId: referenceId } : {}),
      ...(type === "LAB_BOOKING"    ? { labBookingId:    referenceId } : {}),
      ...(type === "APPOINTMENT"    ? { appointmentId:   referenceId } : {}),
    },
  });

  return NextResponse.json({
    razorpayOrderId: rzpOrder.id,
    amount:          rzpOrder.amount,
    currency:        rzpOrder.currency,
    key:             process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    paymentDbId:     payment.id,
  });
}
