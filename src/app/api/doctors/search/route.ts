import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q              = searchParams.get("q") ?? "";
  const specialization = searchParams.get("specialization") ?? "";
  const city           = searchParams.get("city") ?? "";
  const page           = parseInt(searchParams.get("page") ?? "1");
  const limit          = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

  const doctors = await prisma.doctor.findMany({
    where: {
      ...(specialization ? { specialization: { contains: specialization, mode: "insensitive" } } : {}),
      ...(q ? {
        OR: [
          { user:           { name:           { contains: q, mode: "insensitive" } } },
          { specialization: { contains: q,    mode: "insensitive" }                  },
          { bio:            { contains: q,    mode: "insensitive" }                  },
        ],
      } : {}),
      ...(city ? { chambers: { some: { city: { contains: city, mode: "insensitive" } } } } : {}),
    },
    include: {
      user:     { select: { name: true, email: true } },
      chambers: { include: { schedules: true }         },
    },
    skip:    (page - 1) * limit,
    take:    limit,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(doctors);
}
