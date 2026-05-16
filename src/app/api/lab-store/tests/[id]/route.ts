import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

async function getLabForUser(userId: string) {
  return prisma.labStore.findUnique({ where: { userId } });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "LAB_STORE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lab = await getLabForUser(user.id);
  if (!lab) return NextResponse.json({ error: "Lab store not found" }, { status: 404 });

  const test = await prisma.labTest.findFirst({
    where: { id: params.id, labStoreId: lab.id },
  });
  if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

  return NextResponse.json(test);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "LAB_STORE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lab = await getLabForUser(user.id);
  if (!lab) return NextResponse.json({ error: "Lab store not found" }, { status: 404 });

  const existing = await prisma.labTest.findFirst({
    where: { id: params.id, labStoreId: lab.id },
  });
  if (!existing) return NextResponse.json({ error: "Test not found" }, { status: 404 });

  const { name, description, price, turnaroundHours, instructions, sampleType } = await req.json();

  const test = await prisma.labTest.update({
    where: { id: params.id },
    data: {
      name:            name            ?? undefined,
      description:     description     ?? undefined,
      price:           price           ?? undefined,
      turnaroundHours: turnaroundHours ?? undefined,
      instructions:    instructions    ?? undefined,
      sampleType:      sampleType      ?? undefined,
    },
  });

  return NextResponse.json(test);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "LAB_STORE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lab = await getLabForUser(user.id);
  if (!lab) return NextResponse.json({ error: "Lab store not found" }, { status: 404 });

  const existing = await prisma.labTest.findFirst({
    where: { id: params.id, labStoreId: lab.id },
  });
  if (!existing) return NextResponse.json({ error: "Test not found" }, { status: 404 });

  // Check if any active bookings reference this test
  const activeBookings = await prisma.labBooking.count({
    where: {
      labTestId: params.id,
      status: { in: ["PENDING", "CONFIRMED", "SAMPLE_COLLECTED"] },
    },
  });
  if (activeBookings > 0) {
    return NextResponse.json(
      { error: "Cannot delete test with active bookings" },
      { status: 409 }
    );
  }

  await prisma.labTest.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Test deleted" });
}
