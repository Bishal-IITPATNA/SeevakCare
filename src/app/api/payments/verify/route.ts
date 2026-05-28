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
    include: { emiPlan: { include: { installments: true } } },
  });

  // If this is an EMI payment, mark installment #1 as paid
  if (payment.emiPlan) {
    const first = payment.emiPlan.installments.find(i => i.installmentNumber === 1);
    if (first) {
      await prisma.emiInstallment.update({
        where: { id: first.id },
        data:  { status: "PAID", paidAt: new Date(), razorpayPaymentId, razorpaySignature },
      });
    }
  }

  // Activate the linked service
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
    // Mark appointment as ACCEPTED (confirmed) once paid
    await prisma.appointment.update({
      where: { id: payment.appointmentId },
      data:  { status: "ACCEPTED" },
    });
  }

  const isEmi = !!payment.emiPlan;
  const notifMsg = isEmi
    ? `EMI instalment 1 of ${payment.emiPlan!.tenureMonths} paid — ₹${Number(payment.emiPlan!.monthlyEmi).toFixed(2)}. Ref: ${razorpayPaymentId}`
    : `Your payment of ₹${Number(payment.amount).toFixed(2)} was successful. Ref: ${razorpayPaymentId}`;

  await prisma.notification.create({
    data: {
      userId:  user.id,
      title:   isEmi ? "EMI Instalment Paid" : "Payment Successful",
      message: notifMsg,
      type:    "PAYMENT",
    },
  });

  return NextResponse.json({ message: "Payment verified successfully", paymentId: payment.id, isEmi });
}
