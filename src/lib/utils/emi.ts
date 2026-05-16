export const EMI_ANNUAL_RATE = 15; // 15% per annum
export const EMI_TENURES = [3, 6, 12, 24] as const;
export type EmiTenure = (typeof EMI_TENURES)[number];

export interface EmiBreakdown {
  tenureMonths: EmiTenure;
  monthlyEmi: number;
  totalPayable: number;
  totalInterest: number;
}

export function calculateEmi(principal: number, tenureMonths: EmiTenure): EmiBreakdown {
  const r = EMI_ANNUAL_RATE / 12 / 100; // 0.0125 monthly
  const factor = Math.pow(1 + r, tenureMonths);
  const emi = (principal * r * factor) / (factor - 1);
  const monthlyEmi   = Math.round(emi * 100) / 100;
  const totalPayable = Math.round(monthlyEmi * tenureMonths * 100) / 100;
  const totalInterest = Math.round((totalPayable - principal) * 100) / 100;
  return { tenureMonths, monthlyEmi, totalPayable, totalInterest };
}

export function getAllEmiOptions(principal: number): EmiBreakdown[] {
  return EMI_TENURES.map((t) => calculateEmi(principal, t));
}
