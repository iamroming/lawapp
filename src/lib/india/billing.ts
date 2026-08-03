export interface GSTCalculation {
  baseAmount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  totalAmount: number;
  isInterState: boolean;
}

export interface TDSRecord {
  invoiceId: string;
  clientId: string;
  tdsRate: number;
  tdsAmount: number;
  panNumber: string;
  quarter: string;
  financialYear: string;
}

// Indian states for GST calculation
export const INDIAN_STATES: Record<string, string> = {
  "AN": "Andaman and Nicobar Islands",
  "AP": "Andhra Pradesh",
  "AR": "Arunachal Pradesh",
  "AS": "Assam",
  "BR": "Bihar",
  "CH": "Chandigarh",
  "CG": "Chhattisgarh",
  "DL": "Delhi",
  "GA": "Goa",
  "GJ": "Gujarat",
  "HR": "Haryana",
  "HP": "Himachal Pradesh",
  "JK": "Jammu and Kashmir",
  "JH": "Jharkhand",
  "KA": "Karnataka",
  "KL": "Kerala",
  "LA": "Ladakh",
  "LD": "Lakshadweep",
  "MP": "Madhya Pradesh",
  "MH": "Maharashtra",
  "MN": "Manipur",
  "ML": "Meghalaya",
  "MZ": "Mizoram",
  "NL": "Nagaland",
  "OD": "Odisha",
  "PY": "Puducherry",
  "PB": "Punjab",
  "RJ": "Rajasthan",
  "SK": "Sikkim",
  "TN": "Tamil Nadu",
  "TS": "Telangana",
  "TR": "Tripura",
  "UP": "Uttar Pradesh",
  "UT": "Uttarakhand",
  "WB": "West Bengal",
};

// State codes for GST
export const STATE_CODES: Record<string, string> = {
  "AN": "35", "AP": "37", "AR": "12", "AS": "18", "BR": "10",
  "CH": "04", "CG": "22", "DL": "07", "GA": "30", "GJ": "24",
  "HR": "06", "HP": "02", "JK": "01", "JH": "20", "KA": "29",
  "KL": "32", "LA": "38", "LD": "31", "MP": "23", "MH": "27",
  "MN": "14", "ML": "17", "MZ": "15", "NL": "13", "OD": "21",
  "PY": "34", "PB": "03", "RJ": "08", "SK": "11", "TN": "33",
  "TS": "36", "TR": "16", "UP": "09", "UT": "05", "WB": "19",
};

// HSN/SAC codes for legal services
export const LEGAL_HSN_CODES = {
  LEGAL_SERVICES: "9982", // Legal and accounting services
  LITIGATION: "998221", // Litigation and dispute resolution services
  LEGAL_ADVISORY: "998222", // Legal advisory and consulting services
  DOCUMENT_DRAFTING: "998223", // Document drafting and review services
  NOTARY: "998224", // Notarial services and certification
};

// TDS rates for professional services
export const TDS_RATES = {
  SECTION_194J_PROFESSIONAL: 10, // Section 194J - Professional/technical fees
  SECTION_194J_CONTRACTOR: 2, // Section 194J - Call center operations
  SECTION_194C_INDIVIDUAL: 1, // Section 194C - Individual contractor
  SECTION_194C_OTHER: 2, // Section 194C - Other contractors
};

/**
 * Calculate GST for legal services
 * Legal services are subject to 18% GST (9% CGST + 9% SGST for intra-state)
 * or 18% IGST for inter-state
 */
export function calculateGST(
  baseAmount: number,
  supplyState: string, // State code of the client (place of supply)
  receiverState: string, // State code of the lawyer (registration state)
  gstRate: number = 18
): GSTCalculation {
  const isInterState = supplyState !== receiverState;
  const halfRate = gstRate / 2;

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isInterState) {
    igst = Math.round(baseAmount * gstRate / 100 * 100) / 100;
  } else {
    cgst = Math.round(baseAmount * halfRate / 100 * 100) / 100;
    sgst = Math.round(baseAmount * halfRate / 100 * 100) / 100;
  }

  const totalTax = cgst + sgst + igst;
  const totalAmount = baseAmount + totalTax;

  return {
    baseAmount,
    gstRate,
    cgst,
    sgst,
    igst,
    totalTax,
    totalAmount,
    isInterState,
  };
}

/**
 * Calculate TDS deduction
 * Applicable when client is a company and payment exceeds ₹30,000
 */
export function calculateTDS(
  amount: number,
  clientType: "individual" | "company" | "government",
  panAvailable: boolean = true
): { tdsRate: number; tdsAmount: number; netAmount: number } {
  // TDS not applicable if:
  // 1. Client is individual/HUF and payment < ₹50,000
  // 2. No PAN provided (20% or highest rate)
  if (clientType === "individual") {
    if (amount < 50000) {
      return { tdsRate: 0, tdsAmount: 0, netAmount: amount };
    }
    const rate = panAvailable ? TDS_RATES.SECTION_194J_PROFESSIONAL : 20;
    const tdsAmount = Math.round(amount * rate / 100 * 100) / 100;
    return { tdsRate: rate, tdsAmount, netAmount: amount - tdsAmount };
  }

  // For companies, TDS is applicable on all amounts
  const rate = panAvailable ? TDS_RATES.SECTION_194J_PROFESSIONAL : 20;
  const tdsAmount = Math.round(amount * rate / 100 * 100) / 100;
  return { tdsRate: rate, tdsAmount, netAmount: amount - tdsAmount };
}

/**
 * Get current Indian financial year
 * FY runs from April 1 to March 31
 */
export function getCurrentFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed

  if (month >= 4) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  }
  return `${year - 1}-${year.toString().slice(-2)}`;
}

/**
 * Get current GST quarter
 */
export function getCurrentQuarter(): string {
  const now = new Date();
  const month = now.getMonth() + 1;

  if (month >= 4 && month <= 6) return "Q1";
  if (month >= 7 && month <= 9) return "Q2";
  if (month >= 10 && month <= 12) return "Q3";
  return "Q4";
}

/**
 * Format invoice number with FY and quarter
 */
export function formatInvoiceNumber(prefix: string, sequence: number): string {
  const fy = getCurrentFinancialYear();
  return `${prefix}/${fy}/${sequence.toString().padStart(4, "0")}`;
}

/**
 * Calculate aging for invoices
 */
export function calculateAging(dueDate: string): {
  daysOverdue: number;
  bucket: "current" | "30" | "60" | "90" | "90+";
} {
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = now.getTime() - due.getTime();
  const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysOverdue <= 0) return { daysOverdue: 0, bucket: "current" };
  if (daysOverdue <= 30) return { daysOverdue, bucket: "30" };
  if (daysOverdue <= 60) return { daysOverdue, bucket: "60" };
  if (daysOverdue <= 90) return { daysOverdue, bucket: "90" };
  return { daysOverdue, bucket: "90+" };
}
