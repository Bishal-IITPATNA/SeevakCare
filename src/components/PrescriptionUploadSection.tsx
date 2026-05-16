"use client";
import { useEffect, useRef, useState } from "react";

type UploadStatus = "PENDING" | "ORDERED" | "REJECTED";

interface MedicineOrderSummary {
  id: string;
  status: string;
  totalAmount: string | number;
  createdAt: string;
}

interface PrescriptionUpload {
  id: string;
  fileUrl: string;
  fileName: string;
  notes: string | null;
  status: UploadStatus;
  adminNote: string | null;
  createdAt: string;
  medicineOrders: MedicineOrderSummary[];
}

const STATUS_BADGE: Record<UploadStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  ORDERED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<UploadStatus, string> = {
  PENDING: "Pending Review",
  ORDERED: "Order Created",
  REJECTED: "Rejected",
};

export function PrescriptionUploadSection() {
  const [uploads, setUploads]     = useState<PrescriptionUpload[]>([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes]         = useState("");
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const fileRef                   = useRef<HTMLInputElement>(null);

  async function fetchUploads() {
    setLoading(true);
    try {
      const res = await fetch("/api/prescription-uploads");
      if (res.ok) setUploads(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUploads(); }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("Please select a file"); return; }

    setError(""); setSuccess(""); setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("notes", notes);

      const res = await fetch("/api/prescription-uploads", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Upload failed"); return; }

      setSuccess("Prescription uploaded successfully. Admin will review and create your order.");
      setNotes("");
      if (fileRef.current) fileRef.current.value = "";
      fetchUploads();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Upload Prescription</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Prescription File <span className="text-slate-400 font-normal">(JPG, PNG, PDF — max 5 MB)</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              required
              className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes for the admin (e.g., urgency, preferred brands)…"
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none"
            />
          </div>

          {error   && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <button
            type="submit"
            disabled={uploading}
            className="btn-primary py-2 px-5 flex items-center gap-2"
          >
            {uploading ? "Uploading…" : "📤 Upload Prescription"}
          </button>
        </form>
      </div>

      {/* History */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-base font-semibold text-slate-800 mb-4">My Uploaded Prescriptions</h2>

        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : uploads.length === 0 ? (
          <p className="text-sm text-slate-400">No prescriptions uploaded yet.</p>
        ) : (
          <div className="space-y-4">
            {uploads.map((u) => (
              <div key={u.id} className="border border-slate-100 rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{u.fileName}</p>
                    <p className="text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[u.status]}`}>
                    {STATUS_LABEL[u.status]}
                  </span>
                </div>

                {u.notes && (
                  <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">{u.notes}</p>
                )}

                {u.status === "REJECTED" && u.adminNote && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                    Admin note: {u.adminNote}
                  </p>
                )}

                {u.status === "PENDING" && (
                  <p className="text-xs text-yellow-700 bg-yellow-50 rounded-lg px-3 py-2">
                    Your prescription is under review. Admin will create a medicine order on your behalf.
                  </p>
                )}

                <a
                  href={u.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-sky-600 hover:underline"
                >
                  View file →
                </a>

                {u.medicineOrders.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs font-medium text-slate-600 mb-1">Order created:</p>
                    {u.medicineOrders.map((o) => (
                      <p key={o.id} className="text-xs text-slate-500">
                        ₹{Number(o.totalAmount).toFixed(2)} — {o.status}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
