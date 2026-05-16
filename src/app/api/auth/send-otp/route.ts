import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP } from "@/lib/utils/otp";
import { sendEmail, otpEmailTemplate } from "@/lib/utils/email";

// Only used for FORGOT_PASSWORD — login now uses email+password
export async function POST(req: NextRequest) {
  try {
    const { email, purpose } = await req.json();

    if (purpose !== "FORGOT_PASSWORD") {
      return NextResponse.json({ error: "Invalid purpose" }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success anyway to prevent email enumeration
      return NextResponse.json({ message: "If this email exists, an OTP will be sent" });
    }

    const otp = await generateOTP(user.id, email, purpose);
    await sendEmail({
      to:      email,
      subject: "Seevak Care — Reset your password",
      html:    otpEmailTemplate(user.name, otp, purpose),
    });

    return NextResponse.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("send-otp error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
