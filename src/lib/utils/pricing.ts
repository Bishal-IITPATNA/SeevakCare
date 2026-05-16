export const GST_RATE = 0.05;

export interface MedicinePricing {
  subtotal: number;
  gstAmount: number;
  deliveryCharge: number;
  totalAmount: number;
}

/**
 * GST = 5% of subtotal
 * Delivery = ₹50 if subtotal < ₹500, else 10% of subtotal
 */
export function calculateMedicinePricing(subtotal: number): MedicinePricing {
  const gstAmount = parseFloat((subtotal * GST_RATE).toFixed(2));
  const deliveryCharge =
    subtotal < 500 ? 50 : parseFloat((subtotal * 0.1).toFixed(2));
  const totalAmount = parseFloat((subtotal + gstAmount + deliveryCharge).toFixed(2));
  return { subtotal, gstAmount, deliveryCharge, totalAmount };
}

export function formatINR(amount: number | string): string {
  return `₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}
