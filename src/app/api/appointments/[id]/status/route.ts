import { NextRequest, NextResponse } from "next/server";
import { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { sendEmail, appointmentNotificationEmail } from "@/lib/utils/email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { status, notes, proposedDate, proposedSlotTime } = body as {
    status: string;
    notes?: string;
    proposedDate?: string;
    proposedSlotTime?: string;
  };

  // Fetch current appointment for ownership / state checks
  const existing = await prisma.appointment.findUnique({
    where:   { id: params.id },
    include: {
      patient:  { include: { user: true } },
      doctor:   { include: { user: true } },
      hospital: true,
    },
  });
  if (!existing) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

  // ── Permission gates ──────────────────────────────────────────────────────

  if (user.role === "PATIENT") {
    const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
    if (!patient || existing.patientId !== patient.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const allowed = ["ACCEPTED", "DECLINED", "CANCELLED"];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: "Patients can only accept, decline or cancel" }, { status: 400 });
    }
    if (status === "ACCEPTED" && existing.status !== "SLOT_PROPOSED") {
      return NextResponse.json({ error: "Nothing to accept — no slot has been proposed" }, { status: 400 });
    }
    if (status === "DECLINED" && !["SLOT_PROPOSED", "PENDING"].includes(existing.status)) {
      return NextResponse.json({ error: "Cannot decline at this stage" }, { status: 400 });
    }
  } else if (["DOCTOR", "HOSPITAL_ADMIN"].includes(user.role)) {
    const allowed = ["ACCEPTED", "DECLINED", "COMPLETED", "CANCELLED", "SLOT_PROPOSED"];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (status === "SLOT_PROPOSED" && (!proposedDate || !proposedSlotTime)) {
      return NextResponse.json({ error: "proposedDate and proposedSlotTime are required" }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // ── Build update payload inline so Prisma can infer the type ─────────────

  const isAcceptingProposal =
    status === "ACCEPTED" &&
    existing.status === "SLOT_PROPOSED" &&
    existing.proposedDate != null;

  const appointment = await prisma.appointment.update({
    where: { id: params.id },
    data:  {
      status: status as AppointmentStatus,
      ...(notes !== undefined        ? { notes }                                  : {}),
      ...(status === "SLOT_PROPOSED" ? {
        proposedDate:     new Date(proposedDate!),
        proposedSlotTime: proposedSlotTime!,
      } : {}),
      ...(isAcceptingProposal ? {
        appointmentDate:  existing.proposedDate!,
        slotTime:         existing.proposedSlotTime ?? existing.slotTime,
        proposedDate:     null,
        proposedSlotTime: null,
      } : {}),
    },
    include: {
      patient:  { include: { user: true } },
      doctor:   { include: { user: true } },
      hospital: true,
    },
  });

  // ── Notifications ─────────────────────────────────────────────────────────

  const patUser   = appointment.patient.user;
  const actorName = appointment.doctor?.user?.name ?? appointment.hospital?.name ?? "Hospital";
  const dateStr   = new Date(appointment.appointmentDate).toDateString();

  let notifTitle   = `Appointment ${status}`;
  let notifMessage = `${actorName} has ${status.toLowerCase()} your appointment on ${dateStr}.`;

  if (status === "SLOT_PROPOSED") {
    const propDate = new Date(proposedDate!).toDateString();
    notifTitle   = "New Slot Proposed";
    notifMessage = `${actorName} has proposed a new slot: ${propDate} at ${proposedSlotTime}. Please review and accept or decline.`;

  } else if (isAcceptingProposal) {
    const newDate = new Date(existing.proposedDate!).toDateString();

    // Notify hospital admin that patient accepted
    if (existing.hospitalId) {
      const admin = await prisma.hospitalAdmin.findFirst({ where: { hospitalId: existing.hospitalId } });
      if (admin) {
        await prisma.notification.create({
          data: {
            userId:  admin.userId,
            title:   "Slot Accepted by Patient",
            message: `${patUser.name} accepted the proposed slot: ${newDate} at ${existing.proposedSlotTime}.`,
            type:    "APPOINTMENT",
          },
        });
      }
    }
    // Patient-facing message
    notifTitle   = "Slot Confirmed";
    notifMessage = `Your appointment at ${actorName} has been confirmed for ${newDate} at ${existing.proposedSlotTime}.`;

  } else if (status === "DECLINED" && notes) {
    notifMessage += ` Reason: ${notes}`;
  }

  await prisma.notification.create({
    data: { userId: patUser.id, title: notifTitle, message: notifMessage, type: "APPOINTMENT" },
  });

  // Email (non-blocking, skip for slot proposals — patient must first accept)
  if (status !== "SLOT_PROPOSED") {
    await sendEmail({
      to:      patUser.email,
      subject: `Your Seevak Care appointment has been ${status.toLowerCase()}`,
      html:    appointmentNotificationEmail(patUser.name, actorName, dateStr, status),
    }).catch(() => {});
  }

  return NextResponse.json(appointment);
}
