import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const OTP_EXPIRY_MINUTES = 10;

export async function generateOTP(
  userId: string,
  email: string,
  purpose: string
): Promise<string> {
  await prisma.oTP.updateMany({
    where: { userId, purpose, used: false },
    data: { used: true },
  });

  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60_000);

  await prisma.oTP.create({ data: { userId, email, code, purpose, expiresAt } });
  return code;
}

export async function verifyOTP(
  email: string,
  code: string,
  purpose: string
): Promise<{ valid: boolean; userId?: string }> {
  const otp = await prisma.oTP.findFirst({
    where: { email, code, purpose, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) return { valid: false };
  await prisma.oTP.update({ where: { id: otp.id }, data: { used: true } });
  return { valid: true, userId: otp.userId };
}
