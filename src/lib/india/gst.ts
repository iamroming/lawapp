export const gstRates = [
  { value: "0", label: "Exempt (0%)", labelHi: "छूट (0%)" },
  { value: "5", label: "5%", labelHi: "5%" },
  { value: "12", label: "12%", labelHi: "12%" },
  { value: "18", label: "18%", labelHi: "18%" },
  { value: "28", label: "28%", labelHi: "28%" },
];

export interface GSTBreakdown {
  baseAmount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGST: number;
  totalAmount: number;
}

export function calculateGST(baseAmount: number, gstRate: number, isInterState: boolean): GSTBreakdown {
  const totalGST = Math.round(baseAmount * gstRate / 100);
  
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isInterState) {
    igst = totalGST;
  } else {
    cgst = Math.round(totalGST / 2);
    sgst = totalGST - cgst;
  }

  return {
    baseAmount,
    gstRate,
    cgst,
    sgst,
    igst,
    totalGST,
    totalAmount: baseAmount + totalGST,
  };
}

export const hsnCodes = [
  { code: "997159", description: "Legal services", descriptionHi: "कानूनी सेवाएँ", category: "Services" },
  { code: "997158", description: "Legal consultation services", descriptionHi: "कानूनी परामर्श सेवाएँ", category: "Services" },
  { code: "997151", description: "Court case representation", descriptionHi: "न्यायालय में प्रतिनिधित्व", category: "Services" },
  { code: "997152", description: "Arbitration and mediation services", descriptionHi: "मध्यस्थता सेवाएँ", category: "Services" },
  { code: "997153", description: "Conveyancing services", descriptionHi: "संपत्ति हस्तांतरण सेवाएँ", category: "Services" },
  { code: "997154", description: "Document drafting services", descriptionHi: "दस्तावेज़ मसौदा सेवाएँ", category: "Services" },
  { code: "997155", description: "Patent and trademark services", descriptionHi: "पेटेंट और ट्रेडमार्क सेवाएँ", category: "Services" },
  { code: "997156", description: "Company incorporation services", descriptionHi: "कंपनी निगमन सेवाएँ", category: "Services" },
  { code: "997157", description: "Tax advisory services", descriptionHi: "कर सलाह सेवाएँ", category: "Services" },
];

export function formatNumberToWords(num: number): string {
  num = Math.round(num);
  if (num === 0) return "Zero";
  
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + convert(n % 10000000) : "");
  };
  
  return convert(num);
}

export function formatIndianCurrency(num: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(num);
}
