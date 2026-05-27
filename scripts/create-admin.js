/**
 * Run from project root:
 *   node scripts/create-admin.js
 */

const { PrismaClient } = require("@prisma/client");
const { scrypt, randomBytes } = require("crypto");
const { promisify } = require("util");

const scryptAsync = promisify(scrypt);
const prisma = new PrismaClient();

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf  = await scryptAsync(password, salt, 64);
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
    console.log("Admin already exists:");
    console.log("  Email :", existing.email);
    console.log("  Role  :", existing.role);

    if (process.env.RESET === "true") {
      const newHash = await hashPassword(password);
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash: newHash },
      });
      console.log("\nPassword has been reset to: admin123");
    } else {
      console.log("\nTo reset the password, run:");
      console.log("  $env:RESET='true'; node scripts/create-admin.js");
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

  console.log("\n✅ Admin account created!\n");
  console.log("  Email    :", email);
  console.log("  Password :", password);
  console.log("  Role     : SYSTEM_ADMIN");
  console.log("  User ID  :", admin.id);
  console.log("\nLogin at: https://seevakcare.com/login");
}

main()
  .catch((e) => {
    console.error("Error:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
