import { RazorpayButton } from "@/components/RazorpayButton";

const STATUS_STYLES: Record<string, string> = {
  PENDING:   "badge-pending",
  ACCEPTED:  "badge-accepted",
  DECLINED:  "badge-declined",
  COMPLETED: "badge-completed",
  CANCELLED: "bg-slate-50 text-slate-500 badge",
};

export function AppointmentCard({ appointment, onStatusChange }: { appointment: any; onStatusChange?: () => void }) {
  const docName  = appointment.doctor?.user?.name;
  const hospName = appointment.hospital?.name;
  const dateStr  = new Date(appointment.appointmentDate).toDateString();

  return (
    <div className="card flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={STATUS_STYLES[appointment.status] ?? "badge"}>
            {appointment.status}
          </span>
          {appointment.payment?.status === "SUCCESS" && (
            <span className="badge-paid">PAID</span>
          )}
        </div>
        <p className="font-semibold text-slate-800">
          {docName ? `Dr. ${docName}` : hospName ?? "Appointment"}
        </p>
        <p className="text-sm text-slate-500">{dateStr} at {appointment.slotTime}</p>
        {appointment.reason && (
          <p className="text-xs text-slate-400 mt-1">{appointment.reason}</p>
        )}
        {appointment.chamber && (
          <p className="text-xs text-slate-400">{appointment.chamber.name} — {appointment.chamber.city}</p>
        )}
        {appointment.consultationFee && (
          <p className="text-sm font-medium text-sky-700 mt-1">
            Fee: ₹{Number(appointment.consultationFee).toFixed(2)}
          </p>
        )}
      </div>

      {appointment.status === "ACCEPTED" && !appointment.payment && appointment.consultationFee && (
        <RazorpayButton
          type="APPOINTMENT"
          referenceId={appointment.id}
          label="Pay Now"
          onSuccess={onStatusChange}
        />
      )}
    </div>
  );
}
