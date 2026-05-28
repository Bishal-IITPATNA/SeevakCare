import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

// GET /api/reviews?doctorId=X  OR  ?hospitalId=X
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const doctorId   = searchParams.get("doctorId");
  const hospitalId = searchParams.get("hospitalId");

  if (!doctorId && !hospitalId) {
    return NextResponse.json({ error: "doctorId or hospitalId required" }, { status: 400 });
  }

  const reviews = await prisma.review.findMany({
    where: doctorId ? { doctorId } : { hospitalId: hospitalId! },
    include: {
      patient: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return NextResponse.json({ reviews, average: parseFloat(avg.toFixed(1)), count: reviews.length });
}

// POST /api/reviews — create or update a review (upsert)
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "PATIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
  if (!patient) return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });

  const { reviewType, doctorId, hospitalId, rating, comment } = await req.json();

  if (!reviewType || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "reviewType and rating (1–5) are required" }, { status: 400 });
  }
  if (reviewType === "DOCTOR" && !doctorId) {
    return NextResponse.json({ error: "doctorId required for DOCTOR review" }, { status: 400 });
  }
  if (reviewType === "HOSPITAL" && !hospitalId) {
    return NextResponse.json({ error: "hospitalId required for HOSPITAL review" }, { status: 400 });
  }

  // Upsert — one review per patient per doctor/hospital
  const review = await prisma.review.upsert({
    where: reviewType === "DOCTOR"
      ? { patientId_doctorId: { patientId: patient.id, doctorId: doctorId! } }
      : { patientId_hospitalId: { patientId: patient.id, hospitalId: hospitalId! } },
    update: { rating, comment: comment ?? null },
    create: {
      patientId: patient.id,
      reviewType,
      doctorId:   reviewType === "DOCTOR"   ? doctorId   : null,
      hospitalId: reviewType === "HOSPITAL" ? hospitalId : null,
      rating,
      comment: comment ?? null,
    },
  });

  return NextResponse.json(review, { status: 201 });
}
