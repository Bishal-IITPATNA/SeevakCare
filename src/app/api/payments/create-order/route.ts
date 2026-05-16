import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { createRazorpayOrder } from "@/lib/razorpay";
import { calculateEmi, EMI_ANNUAL_RATE, type EmiTenure } from "@/lib/utils/emi";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, referenceId, isEmi = false, emiTenure } = await req.json();

  let amountINR = 0;
  let receipt   = "";

  if (type === "MEDICINE_ORDER") {
    const order = await prisma.medicineOrder.findUnique({ where: { id: referenceId } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    // Note: otpVerified is the DELIVERY OTP (confirmed at doorstep), NOT a payment prerequisite.
    // Payment is allowed as soon as admin sets status to PAYMENT_PENDING.
    if (order.status !== "PAYMENT_PENDING") return NextResponse.json({ error: "Order is not ready for payment yet. Awaiting admin approval." }, { status: 400 });
    amountINR = parseFloat(order.totalAmount.toString());
    receipt   = `med_${referenceId.slice(-8)}`;

  } else if (type === "LAB_BOOKING") {
    const booking = await prisma.labBooking.findUnique({ where: { id: referenceId }, include: { labTest: true } });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (!booking.otpVerified) return NextResponse.json({ error: "OTP not verified for this booking" }, { status: 400 });
    amountINR = parseFloat(booking.labTest.price.toString());
    receipt   = `lab_${referenceId.slice(-8)}`;

  } else if (type === "APPOINTMENT") {
    const appt = await prisma.appointment.findUnique({ where: { id: referenceId } });
    if (!appt) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    amountINR = parseFloat(appt.consultationFee?.toString() ?? "0");
    receipt   = `appt_${referenceId.slice(-8)}`;

  } else {
    return NextResponse.json({ error: "Invalid payment type" }, { status: 400 });
  }

  if (amountINR <= 0) return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });

  // Idempotency guard: reject if a non-failed payment already exists for this reference
  const existingPayment = await prisma.payment.findFirst({
    where: {
      ...(type === "MEDICINE_ORDER" ? { medicineOrderId: referenceId } : {}),
      ...(type === "LAB_BOOKING"    ? { labBookingId:    referenceId } : {}),
      ...(type === "APPOINTMENT"    ? { appointmentId:   referenceId } : {}),
      status: { not: "FAILED" },
    },
  });
  if (existingPayment) {
    return NextResponse.json(
      { error: "A payment for this reference already exists." },
      { status: 409 }
    );
  }

  if (isEmi) {
    const tenure = Number(emiTenure) as EmiTenure;
    if (![3, 6, 12, 24].includes(tenure)) {
      return NextResponse.json({ error: "Invalid EMI tenure. Choose 3, 6, 12, or 24 months." }, { status: 400 });
    }

    const { monthlyEmi, totalPayable, totalInterest } = calculateEmi(amountINR, tenure);

    // Razorpay order for first installment only
    const rzpOrder = await createRazorpayOrder(monthlyEmi, `${receipt}_emi1`);

    // Payment record stores the principal amount
    const payment = await prisma.payment.create({
      data: {
        razorpayOrderId: rzpOrder.id,
        amount:          amountINR,
        ...(type === "MEDICINE_ORDER" ? { medicineOrderId: referenceId } : {}),
        ...(type === "LAB_BOOKING"    ? { labBookingId:    referenceId } : {}),
        ...(type === "APPOINTMENT"    ? { appointmentId:   referenceId } : {}),
      },
    });

    // Create EMI plan
    const emiPlan = await prisma.emiPlan.create({
      data: {
        paymentId:   payment.id,
        totalAmount: amountINR,
        interestRate: EMI_ANNUAL_RATE,
        tenureMonths: tenure,
        monthlyEmi,
        totalPayable,
      },
    });

    // Create all installment records; first one carries the razorpayOrderId
    const now = new Date();
    for (let i = 0; i < tenure; i++) {
      const dueDate = new Date(now);
      dueDate.setMonth(dueDate.getMonth() + i + 1);
      await prisma.emiInstallment.create({
        data: {
          emiPlanId:         emiPlan.id,
          installmentNumber: i + 1,
          dueDate,
          amount:            monthlyEmi,
          ...(i === 0 ? { razorpayOrderId: rzpOrder.id } : {}),
        },
      });
    }

    return NextResponse.json({
      razorpayOrderId: rzpOrder.id,
      amount:          rzpOrder.amount,
      currency:        rzpOrder.currency,
      key:             process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      paymentDbId:     payment.id,
      isEmi:           true,
      emiTenure:       tenure,
      monthlyEmi,
      totalPayable,
      totalInterest,
      principalAmount: amountINR,
    });
  }

  // Full (non-EMI) payment
  const rzpOrder = await createRazorpayOrder(amountINR, receipt);

  const payment = await prisma.payment.create({
    data: {
      razorpayOrderId: rzpOrder.id,
      amount:          amountINR,
      ...(type === "MEDICINE_ORDER" ? { medicineOrderId: referenceId } : {}),
      ...(type === "LAB_BOOKING"    ? { labBookingId:    referenceId } : {}),
      ...(type === "APPOINTMENT"    ? { appointmentId:   referenceId } : {}),
    },
  });

  return NextResponse.json({
    razorpayOrderId: rzpOrder.id,
    amount:          rzpOrder.amount,
    currency:        rzpOrder.currency,
    key:             process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    paymentDbId:     payment.id,
  });
}
