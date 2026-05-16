import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { sendEmail, appointmentNotificationEmail } from "@/lib/utils/email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser(req);
  if (!user || !["DOCTOR", "HOSPITAL_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status, notes } = await req.json();
  const allowed = ["ACCEPTED", "DECLINED", "COMPLETED", "CANCELLED"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const appointment = await prisma.appointment.update({
    where: { id: params.id },
    data:  { status, ...(notes !== undefined ? { notes } : {}) },
    include: {
      patient:  { include: { user: true } },
      doctor:   { include: { user: true } },
      hospital: true,
    },
  });

  const patUser  = appointment.patient.user;
  const actorName = appointment.doctor?.user?.name ?? appointment.hospital?.name ?? "Hospital";
  const dateStr  = new Date(appointment.appointmentDate).toDateString();
  const declineNote = status === "DECLINED" && notes ? ` Reason: ${notes}` : "";

  await prisma.notification.create({
    data: {
      userId:  patUser.id,
      title:   `Appointment ${status}`,
      message: `${actorName} has ${status.toLowerCase()} your appointment on ${dateStr}.${declineNote}`,
      type:    "APPOINTMENT",
    },
  });

  await sendEmail({
    to:      patUser.email,
    subject: `Your Seevak Care appointment has been ${status.toLowerCase()}`,
    html:    appointmentNotificationEmail(patUser.name, actorName, dateStr, status),
  }).catch(() => {});

  return NextResponse.json(appointment);
}
