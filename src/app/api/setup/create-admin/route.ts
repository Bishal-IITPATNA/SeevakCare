/**
 * ONE-TIME setup route — creates the first SYSTEM_ADMIN account.
 * DELETE THIS FILE after you have logged in successfully.
 *
 * Hit in browser: https://seevakcare.com/api/setup/create-admin
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/utils/password";

export async function GET() {
  // Safety: only works if no SYSTEM_ADMIN exists yet
  const existing = await prisma.user.findFirst({
    where: { role: "SYSTEM_ADMIN" },
  });

  if (existing) {
    return NextResponse.json(
      { message: "Admin already exists", email: existing.email },
      { status: 200 }
    );
  }

  const email    = "admin@seevakcare.com";
  const password = "Admin@123";

  const passwordHash = await hashPassword(password);

  const admin = await prisma.user.create({
    data: {
      name:          "System Admin",
      email,
      phone:         "+919771365160",
      passwordHash,
      role:          "SYSTEM_ADMIN",
      emailVerified: true,
    },
  });

  return NextResponse.json({
    success:  true,
    message:  "Admin account created. DELETE /api/setup/create-admin after logging in.",
    email,
    password,
    userId:   admin.id,
    loginUrl: "https://seevakcare.com/login",
  });
}
