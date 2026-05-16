import nodemailer from "nodemailer";

const APP_NAME = "Seevak Care";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? "seevakcare@gmail.com";
const SUPPORT_PHONE = process.env.SUPPORT_PHONE ?? "+919771365160";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,   // Gmail App Password (16-char, spaces ignored)
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(opts: EmailOptions) {
  await transporter.sendMail({
    from: `"${APP_NAME}" <${process.env.SMTP_FROM}>`,
    ...opts,
  });
}

// ── Email template helpers ────────────────────────────────────

function baseLayout(content: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0f9ff;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#0284c7,#0ea5e9);padding:28px 32px;text-align:center;">
      <span style="font-size:32px;">🏥</span>
      <h1 style="color:#fff;font-size:22px;margin:8px 0 0;">${APP_NAME}</h1>
    </div>
    <div style="padding:32px;">
      ${content}
    </div>
    <div style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">
        Need help? Email us at <a href="mailto:${SUPPORT_EMAIL}" style="color:#0284c7;">${SUPPORT_EMAIL}</a>
        or call <a href="tel:${SUPPORT_PHONE}" style="color:#0284c7;">${SUPPORT_PHONE}</a>
      </p>
      <p style="margin:8px 0 0;color:#cbd5e1;font-size:11px;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

export function otpEmailTemplate(name: string, otp: string, purpose: string) {
  const labels: Record<string, string> = {
    LOGIN: "sign in to your account",
    FORGOT_PASSWORD: "reset your password",
    MEDICINE_ORDER: "confirm your medicine order",
    LAB_BOOKING: "confirm your lab test booking",
  };
  return baseLayout(`
    <h2 style="color:#0f172a;margin-top:0;">Verification Code</h2>
    <p style="color:#475569;">Hi <strong>${name}</strong>, use the code below to ${labels[purpose] ?? "verify"}.</p>
    <div style="background:#f0f9ff;border:2px dashed #0ea5e9;border-radius:12px;text-align:center;padding:24px;margin:24px 0;">
      <span style="font-size:44px;font-weight:700;letter-spacing:12px;color:#0284c7;">${otp}</span>
    </div>
    <p style="color:#94a3b8;font-size:13px;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
  `);
}

export function appointmentNotificationEmail(
  patientName: string,
  doctorName: string,
  date: string,
  status: string
) {
  const color = status === "ACCEPTED" ? "#16a34a" : "#dc2626";
  const icon  = status === "ACCEPTED" ? "✅" : "❌";
  return baseLayout(`
    <h2 style="color:#0f172a;margin-top:0;">${icon} Appointment ${status === "ACCEPTED" ? "Confirmed" : "Declined"}</h2>
    <p style="color:#475569;">Hi <strong>${patientName}</strong>,</p>
    <p style="color:#475569;">Your appointment with <strong>Dr. ${doctorName}</strong> on <strong>${date}</strong> has been
      <span style="color:${color};font-weight:700;">${status}</span>.
    </p>
    <p style="color:#475569;">Login to ${APP_NAME} to view full details and manage your bookings.</p>
  `);
}

export function orderApprovedEmail(patientName: string, orderId: string, totalAmount: string) {
  return baseLayout(`
    <h2 style="color:#0f172a;margin-top:0;">🛒 Order Approved!</h2>
    <p style="color:#475569;">Hi <strong>${patientName}</strong>,</p>
    <p style="color:#475569;">Your medicine order <strong>#${orderId.slice(-8).toUpperCase()}</strong> has been approved.</p>
    <p style="color:#475569;">Total payable: <strong style="color:#0284c7;font-size:18px;">${totalAmount}</strong></p>
    <p style="color:#475569;">Please login to ${APP_NAME} and proceed with payment to start delivery.</p>
  `);
}

export function orderDispatchedEmail(
  patientName: string,
  orderId: string,
  trackingNumber: string,
  estimatedDelivery?: string
) {
  return baseLayout(`
    <h2 style="color:#0f172a;margin-top:0;">🚚 Order Dispatched!</h2>
    <p style="color:#475569;">Hi <strong>${patientName}</strong>,</p>
    <p style="color:#475569;">Your medicine order <strong>#${orderId.slice(-8).toUpperCase()}</strong> is on its way!</p>
    ${trackingNumber ? `<p style="color:#475569;">Tracking number: <strong style="color:#0284c7;">${trackingNumber}</strong></p>` : ""}
    ${estimatedDelivery ? `<p style="color:#475569;">Estimated delivery: <strong>${new Date(estimatedDelivery).toDateString()}</strong></p>` : ""}
    <p style="color:#475569;">Show your delivery OTP to the delivery person when medicines arrive.</p>
    <p style="color:#475569;">Login to ${APP_NAME} to track your order.</p>
  `);
}

export function labReportReadyEmail(patientName: string, testName: string, reportUrl: string) {
  return baseLayout(`
    <h2 style="color:#0f172a;margin-top:0;">🧪 Lab Report Ready</h2>
    <p style="color:#475569;">Hi <strong>${patientName}</strong>,</p>
    <p style="color:#475569;">Your <strong>${testName}</strong> report is now available.</p>
    <a href="${reportUrl}" style="display:inline-block;background:#0284c7;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">
      Download Report
    </a>
  `);
}
