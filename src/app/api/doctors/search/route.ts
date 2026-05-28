import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q              = searchParams.get("q") ?? "";
  const specialization = searchParams.get("specialization") ?? "";
  const city           = searchParams.get("city") ?? "";
  const sortBy         = searchParams.get("sortBy") ?? "";       // "rating" | ""
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
    skip:    sortBy === "rating" ? 0 : (page - 1) * limit,  // fetch all if sorting by rating
    take:    sortBy === "rating" ? 200 : limit,
    orderBy: { createdAt: "desc" },
  });

  // Fetch average ratings for these doctors
  const doctorIds = doctors.map(d => d.id);
  const ratingsRaw = doctorIds.length > 0
    ? await prisma.review.groupBy({
        by:    ["doctorId"],
        where: { doctorId: { in: doctorIds } },
        _avg:  { rating: true },
        _count: { rating: true },
      })
    : [];

  const ratingMap: Record<string, { avg: number; count: number }> = {};
  for (const r of ratingsRaw) {
    if (r.doctorId) ratingMap[r.doctorId] = { avg: r._avg.rating ?? 0, count: r._count.rating };
  }

  let result = doctors.map(d => ({
    ...d,
    avgRating:   parseFloat((ratingMap[d.id]?.avg ?? 0).toFixed(1)),
    reviewCount: ratingMap[d.id]?.count ?? 0,
  }));

  // Sort by rating descending, then paginate
  if (sortBy === "rating") {
    result.sort((a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount);
    result = result.slice((page - 1) * limit, page * limit);
  }

  return NextResponse.json(result);
}
