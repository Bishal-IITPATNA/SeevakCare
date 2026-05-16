import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "LAB_STORE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lab = await prisma.labStore.findUnique({ where: { userId: user.id } });
  if (!lab) return NextResponse.json({ error: "Lab store not found" }, { status: 404 });

  const tests = await prisma.labTest.findMany({
    where:   { labStoreId: lab.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tests);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "LAB_STORE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lab = await prisma.labStore.findUnique({ where: { userId: user.id } });
  if (!lab) return NextResponse.json({ error: "Lab store not found" }, { status: 404 });

  const { name, description, price, turnaroundHours, instructions, sampleType } = await req.json();

  if (!name || price === undefined) {
    return NextResponse.json({ error: "name and price are required" }, { status: 400 });
  }

  const test = await prisma.labTest.create({
    data: {
      labStoreId:     lab.id,
      name,
      description:    description    ?? null,
      price,
      turnaroundHours: turnaroundHours ?? 24,
      instructions:   instructions   ?? null,
      sampleType:     sampleType     ?? null,
    },
  });

  return NextResponse.json(test, { status: 201 });
}
