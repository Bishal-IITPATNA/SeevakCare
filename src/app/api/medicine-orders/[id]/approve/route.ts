import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { sendEmail, orderApprovedEmail } from "@/lib/utils/email";
import { formatINR } from "@/lib/utils/pricing";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "SYSTEM_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await prisma.medicineOrder.update({
    where: { id: params.id },
    data:  { status: "PAYMENT_PENDING" },
    include: { patient: { include: { user: true } } },
  });

  const patUser = order.patient.user;

  await prisma.notification.create({
    data: {
      userId:  patUser.id,
      title:   "Order Approved — Payment Required",
      message: `Your medicine order has been approved. Total: ${formatINR(Number(order.totalAmount))}. Please proceed to payment.`,
      type:    "ORDER",
    },
  });

  await sendEmail({
    to:      patUser.email,
    subject: "Seevak Care — Your medicine order is approved",
    html:    orderApprovedEmail(patUser.name, order.id, formatINR(Number(order.totalAmount))),
  });

  return NextResponse.json(order);
}
