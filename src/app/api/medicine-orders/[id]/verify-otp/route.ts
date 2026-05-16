import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { otp } = await req.json();
  const order = await prisma.medicineOrder.findUnique({ where: { id: params.id } });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.otpCode !== otp) return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  if (order.otpVerified) return NextResponse.json({ message: "Already verified" });

  await prisma.medicineOrder.update({
    where: { id: params.id },
    data:  { otpVerified: true },
  });

  return NextResponse.json({ message: "OTP verified successfully" });
}
