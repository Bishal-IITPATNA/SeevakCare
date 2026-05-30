import Razorpay from "razorpay";
import crypto from "crypto";

function getRazorpayClient() {
  const key_id     = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error(
      "Razorpay credentials missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment variables (Vercel dashboard → Settings → Environment Variables)."
    );
  }
  return new Razorpay({ key_id, key_secret });
}

export async function createRazorpayOrder(amountINR: number, receipt: string) {
  const razorpay = getRazorpayClient();
  const order = await razorpay.orders.create({
    amount: Math.round(amountINR * 100),
    currency: "INR",
    receipt,
    payment_capture: true,
  } as Parameters<typeof razorpay.orders.create>[0]);
  return order;
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_secret) {
    throw new Error("RAZORPAY_KEY_SECRET is not set. Add it to Vercel → Settings → Environment Variables.");
  }
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", key_secret)
    .update(body)
    .digest("hex");
  return expected === signature;
}
