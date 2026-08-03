export interface CourtFeeSlab {
  minAmount: number;
  maxAmount: number | null;
  fee: number;
  type: "fixed" | "percentage";
}

export const courtFeeSlabs: Record<string, CourtFeeSlab[]> = {
  civil: [
    { minAmount: 0, maxAmount: 10000, fee: 500, type: "fixed" },
    { minAmount: 10001, maxAmount: 50000, fee: 1000, type: "fixed" },
    { minAmount: 50001, maxAmount: 100000, fee: 2000, type: "fixed" },
    { minAmount: 100001, maxAmount: 500000, fee: 4000, type: "fixed" },
    { minAmount: 500001, maxAmount: 1000000, fee: 8000, type: "fixed" },
    { minAmount: 1000001, maxAmount: 5000000, fee: 15000, type: "fixed" },
    { minAmount: 5000001, maxAmount: null, fee: 0.5, type: "percentage" },
  ],
  criminal: [
    { minAmount: 0, maxAmount: null, fee: 0, type: "fixed" },
  ],
  writ: [
    { minAmount: 0, maxAmount: null, fee: 0, type: "fixed" },
  ],
  appeal: [
    { minAmount: 0, maxAmount: 100000, fee: 500, type: "fixed" },
    { minAmount: 100001, maxAmount: 500000, fee: 1000, type: "fixed" },
    { minAmount: 500001, maxAmount: null, fee: 2000, type: "fixed" },
  ],
  revision: [
    { minAmount: 0, maxAmount: null, fee: 500, type: "fixed" },
  ],
  misc: [
    { minAmount: 0, maxAmount: null, fee: 100, type: "fixed" },
  ],
};

export const courtLevels = [
  { value: "supreme", label: "Supreme Court", labelHi: "सर्वोच्च न्यायालय" },
  { value: "high", label: "High Court", labelHi: "उच्च न्यायालय" },
  { value: "district", label: "District Court", labelHi: "जिला न्यायालय" },
  { value: "sessions", label: "Sessions Court", labelHi: "सत्र न्यायालय" },
  { value: "magistrate", label: "Magistrate Court", labelHi: "मजिस्ट्रेट न्यायालय" },
];

export const caseTypesForFee = [
  { value: "civil", label: "Civil Suit", labelHi: "दीवानी मुकदमा" },
  { value: "criminal", label: "Criminal Case", labelHi: "फौजदारी मामला" },
  { value: "writ", label: "Writ Petition", labelHi: "रिट याचिका" },
  { value: "appeal", label: "Appeal", labelHi: "अपील" },
  { value: "revision", label: "Revision", labelHi: "संशोधन" },
  { value: "misc", label: "Miscellaneous", labelHi: "विविध" },
];

export function calculateCourtFee(caseType: string, claimAmount: number): number {
  const slabs = courtFeeSlabs[caseType] || courtFeeSlabs.misc;
  
  for (const slab of slabs) {
    if (claimAmount >= slab.minAmount && (slab.maxAmount === null || claimAmount <= slab.maxAmount)) {
      if (slab.type === "fixed") {
        return slab.fee;
      }
      return Math.round(claimAmount * slab.fee / 100);
    }
  }
  
  return 0;
}
