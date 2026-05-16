import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/utils/password";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const allowedRoles = ["PATIENT", "DOCTOR", "HOSPITAL_ADMIN", "LAB_STORE"];
    if (role && !allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        return NextResponse.json({ error: "Phone number already registered" }, { status: 400 });
      }
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        passwordHash,
        role: role ?? "PATIENT",
      },
    });

    if (user.role === "PATIENT") {
      await prisma.patient.create({ data: { userId: user.id } });
    }

    if (user.role === "DOCTOR") {
      await prisma.doctor.create({
        data: {
          userId:          user.id,
          specialization:  "General Medicine",
          qualifications:  "MBBS",
          licenseNumber:   `LIC-${user.id.slice(-8).toUpperCase()}`,
          experienceYears: 0,
        },
      });
    }

    if (user.role === "HOSPITAL_ADMIN") {
      // Hospital admin needs a hospital — create a placeholder they can update later
      const hospital = await prisma.hospital.create({
        data: {
          name:    `${name}'s Hospital`,
          address: "Address not set",
          city:    "City not set",
          phone:   phone ?? "Not set",
          email:   email,
        },
      });
      await prisma.hospitalAdmin.create({ data: { userId: user.id, hospitalId: hospital.id } });
    }

    if (user.role === "LAB_STORE") {
      await prisma.labStore.create({
        data: {
          userId:  user.id,
          name:    `${name}'s Lab`,
          address: "Address not set",
          city:    "City not set",
          phone:   phone ?? "Not set",
        },
      });
    }

    return NextResponse.json({ message: "Account created", userId: user.id }, { status: 201 });
  } catch (err) {
    console.error("register error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
