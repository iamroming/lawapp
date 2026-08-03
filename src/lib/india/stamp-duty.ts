export interface StampDutyRate {
  documentType: string;
  state: string;
  rate: number;
  rateType: "percentage" | "fixed";
  minDuty: number;
  maxDuty: number | null;
  registrationFee: number | "percentage";
  registrationPercentage?: number;
}

export const stampDutyRates: Record<string, StampDutyRate[]> = {
  saleDeed: [
    { documentType: "saleDeed", state: "Maharashtra", rate: 5, rateType: "percentage", minDuty: 500, maxDuty: null, registrationFee: 1, registrationPercentage: 1 },
    { documentType: "saleDeed", state: "Delhi", rate: 4, rateType: "percentage", minDuty: 100, maxDuty: null, registrationFee: 2, registrationPercentage: 1 },
    { documentType: "saleDeed", state: "Karnataka", rate: 5.6, rateType: "percentage", minDuty: 500, maxDuty: null, registrationFee: 1, registrationPercentage: 1 },
    { documentType: "saleDeed", state: "Tamil Nadu", rate: 7, rateType: "percentage", minDuty: 500, maxDuty: null, registrationFee: 4, registrationPercentage: 1 },
    { documentType: "saleDeed", state: "Uttar Pradesh", rate: 5, rateType: "percentage", minDuty: 500, maxDuty: null, registrationFee: 2, registrationPercentage: 1 },
    { documentType: "saleDeed", state: "Gujarat", rate: 4.9, rateType: "percentage", minDuty: 500, maxDuty: null, registrationFee: 1, registrationPercentage: 1 },
    { documentType: "saleDeed", state: "Rajasthan", rate: 5, rateType: "percentage", minDuty: 500, maxDuty: null, registrationFee: 1, registrationPercentage: 1 },
    { documentType: "saleDeed", state: "Madhya Pradesh", rate: 5, rateType: "percentage", minDuty: 500, maxDuty: null, registrationFee: 2, registrationPercentage: 1 },
    { documentType: "saleDeed", state: "West Bengal", rate: 5, rateType: "percentage", minDuty: 500, maxDuty: null, registrationFee: 1, registrationPercentage: 1 },
    { documentType: "saleDeed", state: "Andhra Pradesh", rate: 5, rateType: "percentage", minDuty: 500, maxDuty: null, registrationFee: 0.5, registrationPercentage: 1 },
    { documentType: "saleDeed", state: "Telangana", rate: 5, rateType: "percentage", minDuty: 500, maxDuty: null, registrationFee: 0.5, registrationPercentage: 1 },
    { documentType: "saleDeed", state: "Kerala", rate: 5, rateType: "percentage", minDuty: 500, maxDuty: null, registrationFee: 2, registrationPercentage: 1 },
    { documentType: "saleDeed", state: "Bihar", rate: 6, rateType: "percentage", minDuty: 500, maxDuty: null, registrationFee: 2, registrationPercentage: 1 },
    { documentType: "saleDeed", state: "Punjab", rate: 5, rateType: "percentage", minDuty: 500, maxDuty: null, registrationFee: 1, registrationPercentage: 1 },
    { documentType: "saleDeed", state: "Haryana", rate: 5, rateType: "percentage", minDuty: 500, maxDuty: null, registrationFee: 1, registrationPercentage: 1 },
    { documentType: "saleDeed", state: "Odisha", rate: 5, rateType: "percentage", minDuty: 500, maxDuty: null, registrationFee: 2, registrationPercentage: 1 },
    { documentType: "saleDeed", state: "Jharkhand", rate: 4, rateType: "percentage", minDuty: 500, maxDuty: null, registrationFee: 2, registrationPercentage: 1 },
    { documentType: "saleDeed", state: "Chhattisgarh", rate: 5, rateType: "percentage", minDuty: 500, maxDuty: null, registrationFee: 2, registrationPercentage: 1 },
    { documentType: "saleDeed", state: "Goa", rate: 3.5, rateType: "percentage", minDuty: 500, maxDuty: null, registrationFee: 1, registrationPercentage: 1 },
    { documentType: "saleDeed", state: "Himachal Pradesh", rate: 5, rateType: "percentage", minDuty: 500, maxDuty: null, registrationFee: 2, registrationPercentage: 1 },
    { documentType: "saleDeed", state: "Uttarakhand", rate: 5, rateType: "percentage", minDuty: 500, maxDuty: null, registrationFee: 2, registrationPercentage: 1 },
  ],
  mortgageDeed: [
    { documentType: "mortgageDeed", state: "Maharashtra", rate: 0.5, rateType: "percentage", minDuty: 200, maxDuty: 25000, registrationFee: 1, registrationPercentage: 1 },
    { documentType: "mortgageDeed", state: "Delhi", rate: 0.5, rateType: "percentage", minDuty: 100, maxDuty: 25000, registrationFee: 2, registrationPercentage: 1 },
    { documentType: "mortgageDeed", state: "Karnataka", rate: 0.5, rateType: "percentage", minDuty: 200, maxDuty: 25000, registrationFee: 1, registrationPercentage: 1 },
  ],
  leaseAgreement: [
    { documentType: "leaseAgreement", state: "Maharashtra", rate: 0.25, rateType: "percentage", minDuty: 200, maxDuty: null, registrationFee: 1, registrationPercentage: 1 },
    { documentType: "leaseAgreement", state: "Delhi", rate: 0.25, rateType: "percentage", minDuty: 100, maxDuty: null, registrationFee: 2, registrationPercentage: 1 },
  ],
  giftDeed: [
    { documentType: "giftDeed", state: "Maharashtra", rate: 3, rateType: "percentage", minDuty: 500, maxDuty: null, registrationFee: 1, registrationPercentage: 1 },
    { documentType: "giftDeed", state: "Delhi", rate: 3, rateType: "percentage", minDuty: 100, maxDuty: null, registrationFee: 2, registrationPercentage: 1 },
  ],
  partnershipDeed: [
    { documentType: "partnershipDeed", state: "Maharashtra", rate: 1, rateType: "percentage", minDuty: 500, maxDuty: 15000, registrationFee: 2, registrationPercentage: 1 },
    { documentType: "partnershipDeed", state: "Delhi", rate: 1, rateType: "percentage", minDuty: 100, maxDuty: 15000, registrationFee: 2, registrationPercentage: 1 },
  ],
  powerOfAttorney: [
    { documentType: "powerOfAttorney", state: "Maharashtra", rate: 3, rateType: "percentage", minDuty: 500, maxDuty: null, registrationFee: 2, registrationPercentage: 1 },
    { documentType: "powerOfAttorney", state: "Delhi", rate: 3, rateType: "percentage", minDuty: 100, maxDuty: null, registrationFee: 2, registrationPercentage: 1 },
  ],
  affidavit: [
    { documentType: "affidavit", state: "Maharashtra", rate: 100, rateType: "fixed", minDuty: 100, maxDuty: 100, registrationFee: 0, registrationPercentage: 0 },
    { documentType: "affidavit", state: "Delhi", rate: 10, rateType: "fixed", minDuty: 10, maxDuty: 10, registrationFee: 0, registrationPercentage: 0 },
  ],
  agreement: [
    { documentType: "agreement", state: "Maharashtra", rate: 0.5, rateType: "percentage", minDuty: 200, maxDuty: 25000, registrationFee: 1, registrationPercentage: 1 },
    { documentType: "agreement", state: "Delhi", rate: 0.5, rateType: "percentage", minDuty: 100, maxDuty: 25000, registrationFee: 2, registrationPercentage: 1 },
  ],
};

export const documentTypes = [
  { value: "saleDeed", label: "Sale Deed", labelHi: "बिक्री विलेख" },
  { value: "mortgageDeed", label: "Mortgage Deed", labelHi: "बंधक विलेख" },
  { value: "leaseAgreement", label: "Lease Agreement", labelHi: "पट्टा समझौता" },
  { value: "giftDeed", label: "Gift Deed", labelHi: "दान विलेख" },
  { value: "partnershipDeed", label: "Partnership Deed", labelHi: "साझेदारी विलेख" },
  { value: "powerOfAttorney", label: "Power of Attorney", labelHi: "मुख्तारनामा" },
  { value: "affidavit", label: "Affidavit", labelHi: "हलफनामा" },
  { value: "agreement", label: "Agreement", labelHi: "समझौता" },
];

export function calculateStampDuty(
  documentType: string,
  state: string,
  propertyValue: number
): { stampDuty: number; registrationFee: number; total: number } {
  const rates = stampDutyRates[documentType];
  if (!rates) {
    return { stampDuty: 0, registrationFee: 0, total: 0 };
  }

  const rate = rates.find((r) => r.state === state) || rates[0];
  if (!rate) {
    return { stampDuty: 0, registrationFee: 0, total: 0 };
  }

  let stampDuty: number;
  if (rate.rateType === "fixed") {
    stampDuty = rate.rate;
  } else {
    stampDuty = Math.round(propertyValue * rate.rate / 100);
  }

  stampDuty = Math.max(stampDuty, rate.minDuty);
  if (rate.maxDuty !== null) {
    stampDuty = Math.min(stampDuty, rate.maxDuty);
  }

  let registrationFee: number;
  if (typeof rate.registrationFee === "number" && rate.registrationPercentage) {
    registrationFee = Math.round(propertyValue * rate.registrationFee / 100);
  } else {
    registrationFee = typeof rate.registrationFee === "number" ? rate.registrationFee : 0;
  }

  return {
    stampDuty,
    registrationFee,
    total: stampDuty + registrationFee,
  };
}
