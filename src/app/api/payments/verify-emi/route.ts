import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { verifyRazorpaySignature } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, installmentId } = await req.json();

  const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!isValid) return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });

  const installment = await prisma.emiInstallment.update({
    where: { id: installmentId },
    data:  { status: "PAID", paidAt: new Date(), razorpayPaymentId, razorpaySignature },
    include: {
      emiPlan: { include: { installments: true } },
    },
  });

  // Check if all installments are paid → mark plan complete
  const allPaid = installment.emiPlan.installments.every(
    (i) => i.id === installmentId || i.status === "PAID"
  );
  if (allPaid) {
    await prisma.emiPlan.update({
      where: { id: installment.emiPlanId },
      data:  { status: "COMPLETED" },
    });
  }

  await prisma.notification.create({
    data: {
      userId:  user.id,
      title:   "EMI Instalment Paid",
      message: `Instalment ${installment.installmentNumber} of ${installment.emiPlan.tenureMonths} paid — ₹${Number(installment.amount).toFixed(2)}. Ref: ${razorpayPaymentId}`,
      type:    "PAYMENT",
    },
  });

  return NextResponse.json({
    message:           "Instalment payment verified",
    installmentNumber: installment.installmentNumber,
    planCompleted:     allPaid,
  });
}
