import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notification = await prisma.notification.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!notification) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  const updated = await prisma.notification.update({
    where: { id: params.id },
    data:  { isRead: true },
  });

  return NextResponse.json(updated);
}
