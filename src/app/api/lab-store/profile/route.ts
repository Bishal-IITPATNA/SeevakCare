import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "LAB_STORE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lab = await prisma.labStore.findUnique({
    where:   { userId: user.id },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!lab) return NextResponse.json({ error: "Lab store not found" }, { status: 404 });

  return NextResponse.json(lab);
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "LAB_STORE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lab = await prisma.labStore.findUnique({ where: { userId: user.id } });
  if (!lab) return NextResponse.json({ error: "Lab store not found" }, { status: 404 });

  const { name, address, city, phone, homeCollection, homeCollectionCharge } = await req.json();

  const updated = await prisma.labStore.update({
    where: { userId: user.id },
    data: {
      name:                  name                  ?? undefined,
      address:               address               ?? undefined,
      city:                  city                  ?? undefined,
      phone:                 phone                 ?? undefined,
      homeCollection:        homeCollection        ?? undefined,
      homeCollectionCharge:  homeCollectionCharge  ?? undefined,
    },
  });

  return NextResponse.json(updated);
}
