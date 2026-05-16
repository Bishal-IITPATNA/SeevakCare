import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/utils/password";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();
    // identifier = email OR phone

    if (!identifier || !password) {
      return NextResponse.json({ error: "Email/phone and password are required" }, { status: 400 });
    }

    // Find user by email or phone
    const isEmail = identifier.includes("@");
    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: identifier.toLowerCase().trim() }
        : { phone: identifier.trim() },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token     = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.session.create({ data: { userId: user.id, token, expiresAt } });

    const response = NextResponse.json({ message: "Login successful", token });
    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      expires:  expiresAt,
      path:     "/",
      sameSite: "lax",
    });
    return response;
  } catch (err) {
    console.error("login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
