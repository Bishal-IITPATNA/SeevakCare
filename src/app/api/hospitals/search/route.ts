import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q    = searchParams.get("q")?.trim() ?? "";
  const city = searchParams.get("city")?.trim() ?? "";

  const hospitals = await prisma.hospital.findMany({
    where: {
      AND: [
        q    ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { address: { contains: q, mode: "insensitive" } }] } : {},
        city ? { city: { contains: city, mode: "insensitive" } } : {},
      ],
    },
    include: {
      departments: {
        select: { id: true, name: true, description: true, totalBeds: true, occupiedBeds: true },
      },
    },
    orderBy: { name: "asc" },
    take: 30,
  });

  return NextResponse.json(hospitals);
}
