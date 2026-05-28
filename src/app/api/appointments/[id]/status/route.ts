import { NextRequest, NextResponse } from "next/server";
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
  const { status, notes, proposedDate, proposedSlotTime } = body;

  // Fetch current appointment for ownership/state checks
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
    // Patient can only act on their own appointments
    const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
    if (!patient || existing.patientId !== patient.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    // Patient may only accept or decline a slot proposal, or cancel a pending booking
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

  // ── Build update payload ──────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = { status };
  if (notes !== undefined) updateData.notes = notes;

  if (status === "SLOT_PROPOSED") {
    updateData.proposedDate     = new Date(proposedDate);
    updateData.proposedSlotTime = proposedSlotTime;
  }

  if (status === "ACCEPTED" && existing.status === "SLOT_PROPOSED" && existing.proposedDate) {
    // Patient accepted the proposed slot — lock in the new date/time
    updateData.appointmentDate  = existing.proposedDate;
    updateData.slotTime         = existing.proposedSlotTime;
    updateData.proposedDate     = null;
    updateData.proposedSlotTime = null;
  }

  // ── Persist ───────────────────────────────────────────────────────────────

  const appointment = await prisma.appointment.update({
    where:   { id: params.id },
    data:    updateData,
    include: {
      patient:  { include: { user: true } },
      doctor:   { include: { user: true } },
      hospital: true,
    },
  });

  // ── Notifications ─────────────────────────────────────────────────────────

  const patUser    = appointment.patient.user;
  const actorName  = appointment.doctor?.user?.name ?? appointment.hospital?.name ?? "Hospital";
  const dateStr    = new Date(appointment.appointmentDate).toDateString();

  let notifTitle   = `Appointment ${status}`;
  let notifMessage = `${actorName} has ${status.toLowerCase()} your appointment on ${dateStr}.`;

  if (status === "SLOT_PROPOSED") {
    const propDate = new Date(proposedDate).toDateString();
    notifTitle   = "New Slot Proposed";
    notifMessage = `${actorName} has proposed a new slot: ${propDate} at ${proposedSlotTime}. Please review and accept or decline.`;
  } else if (status === "ACCEPTED" && existing.status === "SLOT_PROPOSED") {
    // Patient accepted — notify hospital admin
    const newDate = new Date(existing.proposedDate!).toDateString();
    notifTitle   = "Slot Accepted by Patient";
    notifMessage = `Patient ${patUser.name} accepted the proposed slot: ${newDate} at ${existing.proposedSlotTime}.`;
    // Notify hospital admin instead
    if (existing.hospitalId) {
      const admin = await prisma.hospitalAdmin.findFirst({ where: { hospitalId: existing.hospitalId } });
      if (admin) {
        await prisma.notification.create({
          data: { userId: admin.userId, title: notifTitle, message: notifMessage, type: "APPOINTMENT" },
        });
      }
    }
    // Still notify patient of their confirmed slot
    notifTitle   = "Slot Confirmed";
    notifMessage = `Your appointment at ${actorName} has been confirmed for ${newDate} at ${existing.proposedSlotTime}.`;
  } else if (status === "DECLINED" && notes) {
    notifMessage += ` Reason: ${notes}`;
  }

  // Notify patient (for most status changes)
  if (!(status === "ACCEPTED" && existing.status === "SLOT_PROPOSED")) {
    // For patient-accepted proposed slot, notification was already handled above
    await prisma.notification.create({
      data: { userId: patUser.id, title: notifTitle, message: notifMessage, type: "APPOINTMENT" },
    });
  } else {
    await prisma.notification.create({
      data: { userId: patUser.id, title: notifTitle, message: notifMessage, type: "APPOINTMENT" },
    });
  }

  // Email (non-blocking)
  if (status !== "SLOT_PROPOSED") {
    await sendEmail({
      to:      patUser.email,
      subject: `Your Seevak Care appointment has been ${status.toLowerCase()}`,
      html:    appointmentNotificationEmail(patUser.name, actorName, dateStr, status),
    }).catch(() => {});
  }

  return NextResponse.json(appointment);
}
