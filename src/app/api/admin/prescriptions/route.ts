import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "SYSTEM_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prescriptions = await prisma.prescription.findMany({
    include: {
      patient:  { include: { user: { select: { name: true, email: true } } } },
      doctor:   { include: { user: { select: { name: true } } } },
      medicines: true,
      labTests:  true,
      bill:      { include: { items: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return NextResponse.json(prescriptions);
}
