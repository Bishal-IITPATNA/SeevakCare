import { NextRequest, NextResponse } from "next/server";
import { verifyOTP } from "@/lib/utils/otp";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email, code, purpose } = await req.json();

    const result = await verifyOTP(email, code, purpose);
    if (!result.valid) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    const token     = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.session.create({
      data: { userId: result.userId!, token, expiresAt },
    });

    const response = NextResponse.json({ message: "Authenticated", token });
    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      expires:  expiresAt,
      path:     "/",
      sameSite: "lax",
    });
    return response;
  } catch (err) {
    console.error("verify-otp error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
