import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { hospitalId: string } }
) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const services = await prisma.hospitalService.findMany({
      where:   { hospitalId: params.hospitalId, isActive: true },
      include: { department: { select: { id: true, name: true } } },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(services);
  } catch (err) {
    console.error("[hospitals/services] DB error:", err);
    // Return empty array so the patient UI shows "no services" gracefully
    // instead of crashing. Usually means a pending schema migration.
    return NextResponse.json([]);
  }
}
