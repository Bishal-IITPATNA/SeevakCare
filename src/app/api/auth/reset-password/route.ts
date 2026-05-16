import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOTP } from "@/lib/utils/otp";
import { hashPassword } from "@/lib/utils/password";

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: "Email, OTP and new password are required" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const result = await verifyOTP(email, otp, "FORGOT_PASSWORD");
    if (!result.valid) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: result.userId },
      data:  { passwordHash },
    });

    // Invalidate all existing sessions so stale sessions can't be reused
    await prisma.session.deleteMany({ where: { userId: result.userId } });

    return NextResponse.json({ message: "Password reset successfully. Please sign in." });
  } catch (err) {
    console.error("reset-password error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
