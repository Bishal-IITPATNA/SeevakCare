import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q      = searchParams.get("q")?.trim() ?? "";
  const city   = searchParams.get("city")?.trim() ?? "";
  const sortBy = searchParams.get("sortBy")?.trim() ?? "";   // "rating" | ""

  const hospitals = await prisma.hospital.findMany({
    where: {
      AND: [
        q    ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { address: { contains: q, mode: "insensitive" } }] } : {},
        city ? { city: { contains: city, mode: "insensitive" } } : {},
      ],
    },
    include: {
      departments: {
        select: { id: true, name: true, description: true, totalBeds: true, occupiedBeds: true },
      },
    },
    orderBy: { name: "asc" },
    take: 50,
  });

  // Start with zero ratings for all hospitals; populate if the Review table exists
  const ratingMap: Record<string, { avg: number; count: number }> = {};
  try {
    const hospitalIds = hospitals.map(h => h.id);
    if (hospitalIds.length > 0) {
      const ratingsRaw = await prisma.review.groupBy({
        by:     ["hospitalId"],
        where:  { hospitalId: { in: hospitalIds } },
        _avg:   { rating: true },
        _count: { rating: true },
      });
      for (const r of ratingsRaw) {
        if (r.hospitalId) ratingMap[r.hospitalId] = { avg: r._avg.rating ?? 0, count: r._count.rating };
      }
    }
  } catch {
    // Review table not yet migrated — return hospitals without ratings
  }

  let result = hospitals.map(h => ({
    ...h,
    avgRating:   parseFloat((ratingMap[h.id]?.avg ?? 0).toFixed(1)),
    reviewCount: ratingMap[h.id]?.count ?? 0,
  }));

  // Sort by rating descending if requested
  if (sortBy === "rating") {
    result.sort((a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount);
  }

  return NextResponse.json(result);
}
