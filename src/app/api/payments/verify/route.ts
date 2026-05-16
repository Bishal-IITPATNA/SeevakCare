import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { verifyRazorpaySignature } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();

  const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  const payment = await prisma.payment.update({
    where: { razorpayOrderId },
    data:  { razorpayPaymentId, razorpaySignature, status: "SUCCESS" },
  });

  // Update linked entity
  if (payment.medicineOrderId) {
    await prisma.medicineOrder.update({
      where: { id: payment.medicineOrderId },
      data:  { status: "PAID" },
    });
  }
  if (payment.labBookingId) {
    await prisma.labBooking.update({
      where: { id: payment.labBookingId },
      data:  { status: "CONFIRMED" },
    });
  }
  if (payment.appointmentId) {
    const appt = await prisma.appointment.findUnique({ where: { id: payment.appointmentId } });
    if (appt?.status === "ACCEPTED") {
      // Payment confirms the slot — keep status ACCEPTED (doctor still needs to complete)
    }
  }

  // Create payment notification
  await prisma.notification.create({
    data: {
      userId:  user.id,
      title:   "Payment Successful",
      message: `Your payment of ₹${Number(payment.amount).toFixed(2)} was successful. Ref: ${razorpayPaymentId}`,
      type:    "PAYMENT",
    },
  });

  return NextResponse.json({ message: "Payment verified successfully", paymentId: payment.id });
}
