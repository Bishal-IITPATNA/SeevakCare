import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { sendEmail, labReportReadyEmail } from "@/lib/utils/email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "LAB_STORE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status, reportUrl } = await req.json();
  const allowed = ["CONFIRMED", "SAMPLE_COLLECTED", "REPORT_UPLOADED", "CANCELLED"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const booking = await prisma.labBooking.update({
    where: { id: params.id },
    data:  { status, ...(reportUrl ? { reportUrl } : {}) },
    include: {
      patient:  { include: { user: true } },
      labTest:  true,
      labStore: true,
    },
  });

  const msgs: Record<string, string> = {
    CONFIRMED:       `Your lab booking for ${booking.labTest.name} has been confirmed.`,
    SAMPLE_COLLECTED: `Sample for your ${booking.labTest.name} test has been collected.`,
    REPORT_UPLOADED: `Your ${booking.labTest.name} report is ready. Download it from your dashboard.`,
    CANCELLED:       `Your lab booking for ${booking.labTest.name} has been cancelled.`,
  };

  await prisma.notification.create({
    data: {
      userId:  booking.patient.userId,
      title:   `Lab Booking ${status.replace("_", " ")}`,
      message: msgs[status],
      type:    "LAB",
    },
  });

  if (status === "REPORT_UPLOADED" && reportUrl) {
    await sendEmail({
      to:      booking.patient.user.email,
      subject: `Seevak Care — Your ${booking.labTest.name} report is ready`,
      html:    labReportReadyEmail(booking.patient.user.name, booking.labTest.name, reportUrl),
    });
  }

  return NextResponse.json(booking);
}
