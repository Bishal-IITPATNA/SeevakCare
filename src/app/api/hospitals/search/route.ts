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

  // Fetch average ratings for these hospitals
  const hospitalIds = hospitals.map(h => h.id);
  const ratingsRaw = hospitalIds.length > 0
    ? await prisma.review.groupBy({
        by:    ["hospitalId"],
        where: { hospitalId: { in: hospitalIds } },
        _avg:  { rating: true },
        _count: { rating: true },
      })
    : [];

  const ratingMap: Record<string, { avg: number; count: number }> = {};
  for (const r of ratingsRaw) {
    if (r.hospitalId) ratingMap[r.hospitalId] = { avg: r._avg.rating ?? 0, count: r._count.rating };
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
