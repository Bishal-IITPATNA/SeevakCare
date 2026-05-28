import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "SYSTEM_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appointments = await prisma.appointment.findMany({
    include: {
      patient:    { include: { user: { select: { name: true, email: true, phone: true } } } },
      doctor:     { include: { user: { select: { name: true } } } },
      hospital:   true,
      department: true,
      chamber:    true,
      payment:    true,
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return NextResponse.json(appointments);
}
