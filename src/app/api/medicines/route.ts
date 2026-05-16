import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q        = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";

  const medicines = await prisma.medicine.findMany({
    where: {
      stock: { gt: 0 },
      ...(q ? {
        OR: [
          { name:        { contains: q, mode: "insensitive" } },
          { genericName: { contains: q, mode: "insensitive" } },
          { category:    { contains: q, mode: "insensitive" } },
        ],
      } : {}),
      ...(category ? { category: { contains: category, mode: "insensitive" } } : {}),
    },
    orderBy: { name: "asc" },
    take: 50,
  });

  return NextResponse.json(medicines);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "SYSTEM_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();
  const medicine = await prisma.medicine.create({ data });
  return NextResponse.json(medicine, { status: 201 });
}
