import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where:   { userId: user.id },
    orderBy: { createdAt: "desc" },
    take:    50,
  });

  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();

  if (id) {
    await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data:  { isRead: true },
    });
  } else {
    // Mark all as read
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data:  { isRead: true },
    });
  }

  return NextResponse.json({ message: "Updated" });
}
