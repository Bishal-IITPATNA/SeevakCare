import Razorpay from "razorpay";
import crypto from "crypto";

export async function createRazorpayOrder(amountINR: number, receipt: string) {
  const razorpay = new Razorpay({
    key_id:    process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
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
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");
  return expected === signature;
}
