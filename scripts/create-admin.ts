/**
 * One-time script to create a SYSTEM_ADMIN account in the database.
 * Run from the project root:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/create-admin.ts
 */

import { PrismaClient } from "@prisma/client";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf  = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${buf.toString("hex")}`;
}

async function main() {
  const email    = "admin@seevakcare.com";
  const password = "admin123";
  const name     = "System Admin";
  const phone    = "+919771365160";

  // Check if already exists
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { role: "SYSTEM_ADMIN" }] },
  });

  if (existing) {
    console.log("✅ Admin already exists:");
    console.log(`   Email : ${existing.email}`);
    console.log(`   Role  : ${existing.role}`);
    console.log("\nIf you want to reset the password, run with RESET=true:");
    console.log("   RESET=true npx ts-node --compiler-options '{\"module\":\"CommonJS\"}' scripts/create-admin.ts");

    if (process.env.RESET === "true") {
      const newHash = await hashPassword(password);
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash: newHash },
      });
      console.log("\n🔑 Password reset to: admin123");
    }
    return;
  }

  const passwordHash = await hashPassword(password);

  const admin = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      role: "SYSTEM_ADMIN",
      emailVerified: true,
    },
  });

  console.log("✅ Admin account created successfully!\n");
  console.log("┌─────────────────────────────────────┐");
  console.log("│         SYSTEM ADMIN CREDENTIALS     │");
  console.log("├─────────────────────────────────────┤");
  console.log(`│ Email    : ${email.padEnd(25)} │`);
  console.log(`│ Password : ${password.padEnd(25)} │`);
  console.log(`│ Role     : SYSTEM_ADMIN              │`);
  console.log("└─────────────────────────────────────┘");
  console.log(`\nUser ID: ${admin.id}`);
  console.log("\n👉 Login at: https://seevakcare.com/login");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
