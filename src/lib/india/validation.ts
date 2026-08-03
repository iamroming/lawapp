export function validateIndianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  const indianPhoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
  return indianPhoneRegex.test(cleaned);
}

export function formatIndianPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "").replace(/^0+/, "");
  if (cleaned.startsWith("91") && cleaned.length === 12) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

export function validateIndianPincode(pincode: string): boolean {
  const cleaned = pincode.replace(/\s/g, "");
  return /^[1-9][0-9]{5}$/.test(cleaned);
}

export function formatIndianCurrency(amount: number): string {
  if (amount < 0) return `-${formatIndianCurrency(-amount)}`;
  const [intPart, decPart] = amount.toFixed(2).split(".");
  let lastThree = intPart.slice(-3);
  const otherNumbers = intPart.slice(0, -3);
  if (otherNumbers !== "") {
    lastThree = "," + lastThree;
  }
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  return `\u20b9${formatted}.${decPart}`;
}

export function formatIndianDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function parseIndianDate(dateStr: string): Date | null {
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) return null;
  const date = new Date(year, month - 1, day);
  if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
    return null;
  }
  return date;
}

export function validateGSTIN(gstin: string): boolean {
  const cleaned = gstin.replace(/\s/g, "").toUpperCase();
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(cleaned);
}

export function validatePAN(pan: string): boolean {
  const cleaned = pan.replace(/\s/g, "").toUpperCase();
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  return panRegex.test(cleaned);
}

export function validateAadhaar(aadhaar: string): boolean {
  const cleaned = aadhaar.replace(/[\s\-]/g, "");
  return /^\d{12}$/.test(cleaned);
}

export function formatIndianGSTIN(gstin: string): string {
  const cleaned = gstin.replace(/\s/g, "").toUpperCase();
  if (cleaned.length !== 15) return gstin;
  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}-${cleaned.slice(11, 12)}-${cleaned.slice(12)}`;
}

export function formatAadhaar(aadhaar: string): string {
  const cleaned = aadhaar.replace(/[\s\-]/g, "");
  if (cleaned.length !== 12) return aadhaar;
  return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8)}`;
}
