import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "SYSTEM_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [
    totalPatients,
    totalDoctors,
    totalAppointments,
    totalOrders,
    totalLabBookings,
    revenue,
    pendingOrders,
    pendingAppointments,
    recentPayments,
    appointmentsByStatus,
    ordersByStatus,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.doctor.count({ where: { isVerified: true } }),
    prisma.appointment.count(),
    prisma.medicineOrder.count(),
    prisma.labBooking.count(),
    prisma.payment.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } }),
    prisma.medicineOrder.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.appointment.count({ where: { status: "PENDING" } }),
    prisma.payment.findMany({
      where:   { status: "SUCCESS", createdAt: { gte: sixMonthsAgo } },
      select:  { amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.appointment.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.medicineOrder.groupBy({ by: ["status"], _count: { id: true } }),
  ]);

  // Aggregate revenue by month
  const revenueByMonth: Record<string, number> = {};
  for (const p of recentPayments) {
    const key = p.createdAt.toISOString().slice(0, 7); // "2025-01"
    revenueByMonth[key] = (revenueByMonth[key] ?? 0) + Number(p.amount);
  }

  return NextResponse.json({
    totals: {
      patients:    totalPatients,
      doctors:     totalDoctors,
      appointments: totalAppointments,
      orders:      totalOrders,
      labBookings: totalLabBookings,
      revenue:     Number(revenue._sum.amount ?? 0),
    },
    pending: {
      orders:       pendingOrders,
      appointments: pendingAppointments,
    },
    revenueByMonth: Object.entries(revenueByMonth).map(([month, amount]) => ({ month, amount })),
    appointmentsByStatus: appointmentsByStatus.map(g => ({ status: g.status, count: g._count.id })),
    ordersByStatus:       ordersByStatus.map(g => ({ status: g.status, count: g._count.id })),
  });
}
