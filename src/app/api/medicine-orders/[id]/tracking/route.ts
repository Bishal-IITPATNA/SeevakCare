import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { sendEmail, orderDispatchedEmail } from "@/lib/utils/email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "SYSTEM_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status, trackingNumber, estimatedDelivery } = await req.json();

  const allowed = ["DISPATCHED", "DELIVERED", "CANCELLED"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const order = await prisma.medicineOrder.update({
    where: { id: params.id },
    data: {
      status,
      ...(trackingNumber    ? { trackingNumber } : {}),
      ...(estimatedDelivery ? { estimatedDelivery: new Date(estimatedDelivery) } : {}),
    },
    include: {
      patient: { include: { user: true } },
      items:   { include: { medicine: true } },
    },
  });

  // Deduct medicine stock when order is delivered
  if (status === "DELIVERED") {
    await Promise.all(
      order.items.map((item) =>
        prisma.medicine.update({
          where: { id: item.medicineId },
          data:  { stock: { decrement: item.quantity } },
        })
      )
    );
  }

  const statusMessages: Record<string, string> = {
    DISPATCHED: `Your medicine order has been dispatched. Tracking: ${trackingNumber ?? "N/A"}`,
    DELIVERED:  "Your medicine order has been delivered. Thank you for choosing Seevak Care!",
    CANCELLED:  "Your medicine order has been cancelled.",
  };

  await prisma.notification.create({
    data: {
      userId:  order.patient.userId,
      title:   `Order ${status}`,
      message: statusMessages[status],
      type:    "ORDER",
    },
  });

  if (status === "DISPATCHED") {
    await sendEmail({
      to:      order.patient.user.email,
      subject: "Seevak Care — Your medicine order has been dispatched",
      html:    orderDispatchedEmail(
        order.patient.user.name,
        order.id,
        trackingNumber ?? "",
        estimatedDelivery
      ),
    });
  }

  return NextResponse.json(order);
}
