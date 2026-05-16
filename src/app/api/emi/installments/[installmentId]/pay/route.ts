import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { createRazorpayOrder } from "@/lib/razorpay";

export async function POST(
  req: NextRequest,
  { params }: { params: { installmentId: string } }
) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const installment = await prisma.emiInstallment.findUnique({
    where: { id: params.installmentId },
    include: { emiPlan: true },
  });

  if (!installment) return NextResponse.json({ error: "Installment not found" }, { status: 404 });
  if (installment.status === "PAID") return NextResponse.json({ error: "Installment already paid" }, { status: 400 });

  const receipt = `emi_${installment.emiPlanId.slice(-6)}_${installment.installmentNumber}`;
  const rzpOrder = await createRazorpayOrder(Number(installment.amount), receipt);

  await prisma.emiInstallment.update({
    where: { id: installment.id },
    data:  { razorpayOrderId: rzpOrder.id },
  });

  return NextResponse.json({
    razorpayOrderId: rzpOrder.id,
    amount:          rzpOrder.amount,
    currency:        rzpOrder.currency,
    key:             process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    installmentId:   installment.id,
    installmentNumber: installment.installmentNumber,
    tenureMonths:    installment.emiPlan.tenureMonths,
  });
}
