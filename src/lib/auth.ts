import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { User } from "@prisma/client";

export async function getSessionUser(req: NextRequest): Promise<User | null> {
  const token =
    req.cookies.get("session_token")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export function requireRole(user: User | null, ...roles: string[]) {
  if (!user) return { error: "Unauthorized", status: 401 };
  if (!roles.includes(user.role)) return { error: "Forbidden", status: 403 };
  return null;
}
