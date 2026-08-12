import jsPDF from "jspdf";
import { formatNumberToWords } from "@/lib/india/gst";

export type InvoiceTemplateId = "classic" | "modern" | "minimal" | "professional";

export interface InvoiceTemplate {
  id: InvoiceTemplateId;
  name: string;
  description: string;
  color: string;
  preview: string;
}

export const INVOICE_TEMPLATES: InvoiceTemplate[] = [
  { id: "classic", name: "Classic Blue", description: "Traditional blue-themed invoice with full details", color: "#1e40af", preview: "Blue header, detailed layout" },
  { id: "modern", name: "Modern Green", description: "Clean green-themed invoice with sidebar", color: "#059669", preview: "Green accents, sidebar layout" },
  { id: "minimal", name: "Minimal", description: "Simple black and white invoice, no frills", color: "#374151", preview: "Clean B&W, minimal design" },
  { id: "professional", name: "Professional Navy", description: "Dark navy corporate-style invoice", color: "#1e3a5f", preview: "Navy theme, corporate look" },
];

export interface InvoiceData {
  id: string;
  invoice_number: string;
  amount: number;
  tax_amount: number;
  gst_rate: number;
  gstin: string | null;
  hsncode: string | null;
  description: string | null;
  status: string;
  due_date: string | null;
  created_at: string;
  cgst?: number;
  sgst?: number;
  igst?: number;
  reverse_charge?: boolean;
  place_of_supply?: string;
}

export interface ClientData {
  full_name: string;
  email: string | null;
  phone: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gst_number: string | null;
  company_name: string | null;
}

export interface CaseData {
  title: string;
  case_number: string;
}

export interface ProfileData {
  firm_name: string | null;
  full_name: string | null;
  address: string | null;
  phone: string | null;
  email?: string | null;
  gstin?: string | null;
  bank_name?: string | null;
  bank_account?: string | null;
  bank_ifsc?: string | null;
  upi_id?: string | null;
  invoice_settings?: InvoiceSettings | null;
}

export interface InvoiceSettings {
  show_firm_name: boolean;
  show_firm_address: boolean;
  show_firm_phone: boolean;
  show_firm_email: boolean;
  show_firm_gstin: boolean;
  show_bank_details: boolean;
  show_upi: boolean;
  show_client_company: boolean;
  show_client_gstin: boolean;
  show_case_details: boolean;
  show_due_date: boolean;
  show_hsn_code: boolean;
  show_gst_breakdown: boolean;
  show_reverse_charge: boolean;
  show_place_of_supply: boolean;
  show_terms: boolean;
  show_payment_instructions: boolean;
  show_footer_notes: boolean;
  footer_notes: string;
  terms_and_conditions: string;
}

const DEFAULT_SETTINGS: InvoiceSettings = {
  show_firm_name: true, show_firm_address: true, show_firm_phone: true, show_firm_email: true,
  show_firm_gstin: true, show_bank_details: true, show_upi: true, show_client_company: true,
  show_client_gstin: true, show_case_details: true, show_due_date: true, show_hsn_code: true,
  show_gst_breakdown: true, show_reverse_charge: true, show_place_of_supply: true,
  show_terms: true, show_payment_instructions: true, show_footer_notes: true,
  footer_notes: "", terms_and_conditions: "Payment due within 30 days. Late payments attract 1.5% monthly interest.",
};

function getS(profile?: ProfileData | null): InvoiceSettings {
  return { ...DEFAULT_SETTINGS, ...profile?.invoice_settings };
}

function formatCurrencyPDF(num: number): string {
  return `Rs. ${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getTotal(invoice: InvoiceData): number {
  return invoice.amount + invoice.tax_amount;
}

// ═══════════════════════════════════════════
// TEMPLATE 1: CLASSIC BLUE
// ═══════════════════════════════════════════
function generateClassic(invoice: InvoiceData, client: ClientData | null, caseData: CaseData | null, profile?: ProfileData | null): Blob {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  let y = 20;
  const primary: [number, number, number] = [30, 64, 175];
  const s = getS(profile);

  const firmName = profile?.firm_name || "Law Firm";
  const ownerName = profile?.full_name || "";

  if (s.show_firm_name) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(...primary); doc.text(firmName, 14, y); y += 6;
    if (ownerName && s.show_firm_name) { doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(60); doc.text(`ADV: ${ownerName}`, 14, y); y += 5; }
  }
  if (s.show_firm_address && profile?.address) { doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100); doc.text(profile.address, 14, y); y += 4; }
  if (s.show_firm_phone && profile?.phone) { doc.setFontSize(8); doc.setTextColor(100); doc.text(`Ph: ${profile.phone}`, 14, y); y += 4; }
  if (s.show_firm_email && profile?.email) { doc.setFontSize(8); doc.setTextColor(100); doc.text(profile.email, 14, y); y += 4; }

  doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(...primary); doc.text("TAX INVOICE", pw - 14, 20, { align: "right" });
  y = Math.max(y, 32) + 2;

  doc.setDrawColor(...primary); doc.setLineWidth(0.8); doc.line(14, y, pw - 14, y); y += 10;

  doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...primary); doc.text("INVOICE DETAILS", 14, y); y += 7;
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(60);
  const left = [`Invoice #: ${invoice.invoice_number}`, `Date: ${new Date(invoice.created_at).toLocaleDateString("en-IN")}`, `Status: ${invoice.status.toUpperCase()}`, s.show_due_date && invoice.due_date ? `Due Date: ${new Date(invoice.due_date).toLocaleDateString("en-IN")}` : ""].filter(Boolean);
  const right = [s.show_hsn_code && invoice.hsncode ? `HSN/SAC: ${invoice.hsncode}` : "", s.show_place_of_supply && invoice.place_of_supply ? `Place of Supply: ${invoice.place_of_supply}` : "", s.show_firm_gstin && invoice.gstin ? `GSTIN: ${invoice.gstin}` : ""].filter(Boolean);
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    if (left[i]) doc.text(left[i], 14, y + i * 5);
    if (right[i]) doc.text(right[i], pw / 2 + 10, y + i * 5);
  }
  y += Math.max(left.length, right.length) * 5 + 6;

  if (client) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...primary); doc.text("BILL TO", 14, y); y += 7;
    doc.setFont("helvetica", "bold"); doc.setTextColor(0); doc.text(client.full_name, 14, y); y += 5;
    doc.setFont("helvetica", "normal"); doc.setTextColor(80);
    if (s.show_client_company && client.company_name) { doc.text(client.company_name, 14, y); y += 5; }
    if (client.address) { doc.text(client.address, 14, y); y += 5; }
    const city = [client.city, client.state, client.pincode].filter(Boolean).join(", ");
    if (city) { doc.text(city, 14, y); y += 5; }
    if (client.phone) { doc.text(`Phone: ${client.phone}`, 14, y); y += 5; }
    if (client.email) { doc.text(`Email: ${client.email}`, 14, y); y += 5; }
    if (s.show_client_gstin && client.gst_number) { doc.text(`GSTIN: ${client.gst_number}`, 14, y); y += 5; }
    y += 4;
  }

  if (s.show_case_details && caseData) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...primary); doc.text("CASE DETAILS", 14, y); y += 7;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(60); doc.text(`${caseData.case_number} - ${caseData.title}`, 14, y); y += 8;
  }

  const showHsn = s.show_hsn_code;
  const colW = showHsn ? [8, 82, 25, 25, 30] : [8, 107, 25, 30];
  const headers = showHsn ? ["#", "Description", "HSN/SAC", "Rate", "Amount"] : ["#", "Description", "Rate", "Amount"];
  doc.setFillColor(...primary); doc.rect(14, y, pw - 28, 8, "F");
  doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  let x = 16;
  for (let i = 0; i < headers.length; i++) { doc.text(headers[i], x, y + 5.5); x += colW[i]; }
  y += 8;
  doc.setTextColor(0); doc.setFont("helvetica", "normal"); doc.setFontSize(8);
  doc.setFillColor(248, 248, 248); doc.rect(14, y, pw - 28, 8, "F");
  doc.setDrawColor(230); doc.rect(14, y, pw - 28, 8, "S");
  x = 16;
  doc.text("1", x, y + 5.5); x += colW[0];
  doc.text(invoice.description || "Legal Services", x, y + 5.5); x += colW[1];
  if (showHsn) { doc.text(invoice.hsncode || "9982", x, y + 5.5); x += colW[2]; }
  doc.text(`${invoice.gst_rate}%`, x, y + 5.5); x += colW[showHsn ? 3 : 2];
  doc.text(formatCurrencyPDF(invoice.amount), x, y + 5.5);
  y += 8;
  doc.setDrawColor(220); doc.line(14, y, pw - 14, y); y += 8;

  const tx = pw - 80; const ax = pw - 14;
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(60);
  doc.text("Subtotal:", tx, y); doc.text(formatCurrencyPDF(invoice.amount), ax, y, { align: "right" }); y += 6;
  if (s.show_gst_breakdown) {
    if (invoice.igst && invoice.igst > 0) { doc.text(`IGST (${invoice.gst_rate}%):`, tx, y); doc.text(formatCurrencyPDF(invoice.igst), ax, y, { align: "right" }); y += 6; }
    else { const h = invoice.gst_rate / 2; if (invoice.cgst && invoice.cgst > 0) { doc.text(`CGST (${h}%):`, tx, y); doc.text(formatCurrencyPDF(invoice.cgst), ax, y, { align: "right" }); y += 6; } if (invoice.sgst && invoice.sgst > 0) { doc.text(`SGST (${h}%):`, tx, y); doc.text(formatCurrencyPDF(invoice.sgst), ax, y, { align: "right" }); y += 6; } }
    if (!invoice.cgst && !invoice.sgst && !invoice.igst && invoice.tax_amount > 0) { doc.text(`GST (${invoice.gst_rate}%):`, tx, y); doc.text(formatCurrencyPDF(invoice.tax_amount), ax, y, { align: "right" }); y += 6; }
  }
  doc.setDrawColor(...primary); doc.setLineWidth(0.8); doc.line(tx, y, ax, y); y += 6;
  const total = getTotal(invoice);
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(...primary); doc.text("Total:", tx, y); doc.text(formatCurrencyPDF(total), ax, y, { align: "right" }); y += 8;
  doc.setFontSize(8); doc.setFont("helvetica", "italic"); doc.setTextColor(100); doc.text(`Amount in Words: ${formatNumberToWords(total)} Rupees Only`, 14, y); y += 10;

  if (s.show_terms) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...primary); doc.text("TERMS & CONDITIONS", 14, y); y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(80);
    const terms = s.terms_and_conditions || "Payment is due within 30 days of invoice date.";
    const lines = doc.splitTextToSize(terms, pw - 28);
    doc.text(lines, 14, y); y += lines.length * 4 + 4;
  }

  if (s.show_bank_details) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...primary); doc.text("BANK DETAILS", 14, y); y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(80);
    doc.text(`Bank: ${profile?.bank_name || "[Your Bank Name]"}`, 14, y); y += 4;
    doc.text(`A/C No: ${profile?.bank_account || "[Your Account Number]"}`, 14, y); y += 4;
    doc.text(`IFSC: ${profile?.bank_ifsc || "[Your IFSC Code]"}`, 14, y); y += 4;
    if (s.show_upi) doc.text(`UPI: ${profile?.upi_id || "[Your UPI ID]"}`, 14, y);
  }

  if (s.show_footer_notes && s.footer_notes) {
    const fy2 = y + 8;
    doc.setFontSize(7); doc.setTextColor(100); doc.text(s.footer_notes, 14, fy2);
  }

  const fy = ph - 15;
  doc.setDrawColor(...primary); doc.setLineWidth(0.3); doc.line(14, fy, pw - 14, fy);
  doc.setFontSize(7); doc.setTextColor(140); doc.text("Powered by CaseFiles Legal Practice Management.", pw / 2, fy + 5, { align: "center" });

  return doc.output("blob");
}

// ═══════════════════════════════════════════
// TEMPLATE 2: MODERN GREEN
// ═══════════════════════════════════════════
function generateModern(invoice: InvoiceData, client: ClientData | null, caseData: CaseData | null, profile?: ProfileData | null): Blob {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const primary: [number, number, number] = [5, 150, 105];
  let y = 20;
  const s = getS(profile);

  doc.setFillColor(5, 150, 105); doc.rect(0, 0, 4, ph, "F");

  const firmName = profile?.firm_name || "Law Firm";
  if (s.show_firm_name) { doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(...primary); doc.text(firmName, 14, y); y += 7; }
  if (s.show_firm_name && profile?.full_name) { doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(80); doc.text(profile.full_name, 14, y); y += 5; }
  if (s.show_firm_phone && profile?.phone) { doc.setFontSize(8); doc.text(`Phone: ${profile.phone}`, 14, y); y += 5; }
  if (s.show_firm_email && profile?.email) { doc.setFontSize(8); doc.text(profile.email, 14, y); y += 5; }

  doc.setFillColor(5, 150, 105); doc.roundedRect(pw - 60, 14, 46, 14, 3, 3, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(255); doc.text("INVOICE", pw - 37, 23, { align: "center" });
  y = Math.max(y, 36);

  doc.setDrawColor(5, 150, 105); doc.setLineWidth(0.5); doc.line(14, y, pw - 14, y); y += 10;

  const mid = pw / 2;
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...primary); doc.text("INVOICE DETAILS", 14, y);
  doc.text("BILL TO", mid + 5, y); y += 7;
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(60);
  const iy = y;
  doc.text(`Invoice: ${invoice.invoice_number}`, 14, iy); doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString("en-IN")}`, 14, iy + 5);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 14, iy + 10);
  if (s.show_due_date && invoice.due_date) doc.text(`Due: ${new Date(invoice.due_date).toLocaleDateString("en-IN")}`, 14, iy + 15);
  if (s.show_hsn_code && invoice.hsncode) doc.text(`HSN: ${invoice.hsncode}`, 14, iy + 20);
  if (s.show_place_of_supply && invoice.place_of_supply) doc.text(`Supply: ${invoice.place_of_supply}`, 14, iy + 25);
  if (client) {
    doc.setFont("helvetica", "bold"); doc.setTextColor(0); doc.text(client.full_name, mid + 5, iy);
    doc.setFont("helvetica", "normal"); doc.setTextColor(80);
    if (s.show_client_company && client.company_name) doc.text(client.company_name, mid + 5, iy + 5);
    if (client.address) doc.text(client.address, mid + 5, iy + 10);
    const city = [client.city, client.state, client.pincode].filter(Boolean).join(", ");
    if (city) doc.text(city, mid + 5, iy + 15);
    if (client.phone) doc.text(`Ph: ${client.phone}`, mid + 5, iy + 20);
    if (s.show_client_gstin && client.gst_number) doc.text(`GSTIN: ${client.gst_number}`, mid + 5, iy + 25);
  }
  y += 28;

  if (s.show_case_details && caseData) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...primary); doc.text(`Case: ${caseData.case_number} - ${caseData.title}`, 14, y); y += 8;
  }

  const showHsn = s.show_hsn_code;
  const colW = showHsn ? [8, 82, 25, 25, 30] : [8, 107, 25, 30];
  const headers = showHsn ? ["#", "Description", "HSN/SAC", "Rate", "Amount"] : ["#", "Description", "Rate", "Amount"];
  doc.setFillColor(5, 150, 105); doc.rect(14, y, pw - 28, 8, "F");
  doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  let x = 16; for (let i = 0; i < headers.length; i++) { doc.text(headers[i], x, y + 5.5); x += colW[i]; }
  y += 8;
  doc.setTextColor(0); doc.setFont("helvetica", "normal"); doc.setFontSize(8);
  doc.setFillColor(240, 255, 245); doc.rect(14, y, pw - 28, 8, "F");
  x = 16; doc.text("1", x, y + 5.5); x += colW[0]; doc.text(invoice.description || "Legal Services", x, y + 5.5); x += colW[1];
  if (showHsn) { doc.text(invoice.hsncode || "9982", x, y + 5.5); x += colW[2]; }
  doc.text(`${invoice.gst_rate}%`, x, y + 5.5); x += colW[showHsn ? 3 : 2]; doc.text(formatCurrencyPDF(invoice.amount), x, y + 5.5);
  y += 8; doc.setDrawColor(200); doc.line(14, y, pw - 14, y); y += 8;

  const tx = pw - 80; const ax = pw - 14;
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(60);
  doc.text("Subtotal:", tx, y); doc.text(formatCurrencyPDF(invoice.amount), ax, y, { align: "right" }); y += 5;
  if (s.show_gst_breakdown) {
    if (invoice.igst && invoice.igst > 0) { doc.text(`IGST:`, tx, y); doc.text(formatCurrencyPDF(invoice.igst), ax, y, { align: "right" }); y += 5; }
    else { const h = invoice.gst_rate / 2; if (invoice.cgst && invoice.cgst > 0) { doc.text(`CGST:`, tx, y); doc.text(formatCurrencyPDF(invoice.cgst), ax, y, { align: "right" }); y += 5; } if (invoice.sgst && invoice.sgst > 0) { doc.text(`SGST:`, tx, y); doc.text(formatCurrencyPDF(invoice.sgst), ax, y, { align: "right" }); y += 5; } }
    if (!invoice.cgst && !invoice.sgst && !invoice.igst && invoice.tax_amount > 0) { doc.text(`GST:`, tx, y); doc.text(formatCurrencyPDF(invoice.tax_amount), ax, y, { align: "right" }); y += 5; }
  }
  doc.setFillColor(5, 150, 105); doc.rect(tx, y + 1, ax - tx, 1, "F"); y += 6;
  const total = getTotal(invoice);
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...primary); doc.text("Total:", tx, y); doc.text(formatCurrencyPDF(total), ax, y, { align: "right" }); y += 8;
  doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(100); doc.text(`Amount in Words: ${formatNumberToWords(total)} Rupees Only`, 14, y); y += 10;

  if (s.show_terms) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...primary); doc.text("TERMS", 14, y); y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(80);
    const terms = s.terms_and_conditions || "Payment due within 30 days.";
    doc.text(terms, 14, y); y += 8;
  }

  if (s.show_bank_details) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...primary); doc.text("BANK DETAILS", 14, y); y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(80);
    doc.text(`Bank: ${profile?.bank_name || "[Bank Name]"}`, 14, y); y += 4;
    doc.text(`A/C: ${profile?.bank_account || "[Account Number]"}`, 14, y); y += 4;
    doc.text(`IFSC: ${profile?.bank_ifsc || "[IFSC]"}`, 14, y);
    if (s.show_upi) { y += 4; doc.text(`UPI: ${profile?.upi_id || "[UPI ID]"}`, 14, y); }
  }

  if (s.show_footer_notes && s.footer_notes) { doc.setFontSize(7); doc.setTextColor(100); doc.text(s.footer_notes, 14, y + 8); }

  const fy = ph - 15;
  doc.setDrawColor(5, 150, 105); doc.setLineWidth(0.3); doc.line(14, fy, pw - 14, fy);
  doc.setFontSize(7); doc.setTextColor(140); doc.text("Powered by CaseFiles Legal Practice Management.", pw / 2, fy + 5, { align: "center" });

  return doc.output("blob");
}

// ═══════════════════════════════════════════
// TEMPLATE 3: MINIMAL
// ═══════════════════════════════════════════
function generateMinimal(invoice: InvoiceData, client: ClientData | null, caseData: CaseData | null, profile?: ProfileData | null): Blob {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  let y = 25;
  const s = getS(profile);

  const firmName = profile?.firm_name || "Law Firm";

  if (s.show_firm_name) { doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(30); doc.text(firmName, 14, y); }
  doc.setFontSize(14); doc.setTextColor(120); doc.text("INVOICE", pw - 14, y, { align: "right" }); y += 8;
  if (s.show_firm_name && profile?.full_name) { doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(100); doc.text(profile.full_name, 14, y); y += 5; }
  if (s.show_firm_address && profile?.address) { doc.setFontSize(8); doc.text(profile.address, 14, y); y += 4; }
  if (s.show_firm_phone && profile?.phone) { doc.text(`Ph: ${profile.phone}`, 14, y); y += 4; }
  if (s.show_firm_email && profile?.email) { doc.text(profile.email, 14, y); y += 4; }
  y += 4;

  doc.setDrawColor(200); doc.setLineWidth(0.3); doc.line(14, y, pw - 14, y); y += 10;

  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(80);
  doc.text(`Invoice: ${invoice.invoice_number}`, 14, y);
  doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString("en-IN")}`, 14, y + 5);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 14, y + 10);
  if (s.show_due_date && invoice.due_date) doc.text(`Due: ${new Date(invoice.due_date).toLocaleDateString("en-IN")}`, 14, y + 15);
  if (s.show_hsn_code && invoice.hsncode) doc.text(`HSN: ${invoice.hsncode}`, 14, y + 20);
  if (client) {
    doc.setFont("helvetica", "bold"); doc.setTextColor(30); doc.text(client.full_name, pw / 2 + 5, y);
    doc.setFont("helvetica", "normal"); doc.setTextColor(80);
    if (s.show_client_company && client.company_name) doc.text(client.company_name, pw / 2 + 5, y + 5);
    if (client.address) doc.text(client.address, pw / 2 + 5, y + 10);
    const city = [client.city, client.state, client.pincode].filter(Boolean).join(", ");
    if (city) doc.text(city, pw / 2 + 5, y + 15);
    if (s.show_client_gstin && client.gst_number) doc.text(`GSTIN: ${client.gst_number}`, pw / 2 + 5, y + 20);
  }
  y += 26;

  if (s.show_case_details && caseData) { doc.setFontSize(8); doc.setTextColor(80); doc.text(`Case: ${caseData.case_number} - ${caseData.title}`, 14, y); y += 8; }

  const showHsn = s.show_hsn_code;
  doc.setDrawColor(200); doc.setLineWidth(0.3);
  doc.line(14, y, pw - 14, y); y += 5;
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(30);
  if (showHsn) { doc.text("#", 16, y); doc.text("Description", 24, y); doc.text("HSN", 110, y); doc.text("Rate", 130, y); doc.text("Amount", pw - 14, y, { align: "right" }); }
  else { doc.text("#", 16, y); doc.text("Description", 24, y); doc.text("Rate", 130, y); doc.text("Amount", pw - 14, y, { align: "right" }); }
  y += 5; doc.line(14, y, pw - 14, y); y += 5;
  doc.setFont("helvetica", "normal"); doc.setTextColor(60);
  doc.text("1", 16, y); doc.text(invoice.description || "Legal Services", 24, y);
  if (showHsn) doc.text(invoice.hsncode || "9982", 110, y);
  doc.text(`${invoice.gst_rate}%`, 130, y); doc.text(formatCurrencyPDF(invoice.amount), pw - 14, y, { align: "right" });
  y += 5; doc.line(14, y, pw - 14, y); y += 8;

  const tx = pw - 70; const ax = pw - 14;
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(80);
  doc.text("Subtotal:", tx, y); doc.text(formatCurrencyPDF(invoice.amount), ax, y, { align: "right" }); y += 5;
  if (s.show_gst_breakdown) {
    if (invoice.igst && invoice.igst > 0) { doc.text(`IGST:`, tx, y); doc.text(formatCurrencyPDF(invoice.igst), ax, y, { align: "right" }); y += 5; }
    else { const h = invoice.gst_rate / 2; if (invoice.cgst && invoice.cgst > 0) { doc.text(`CGST:`, tx, y); doc.text(formatCurrencyPDF(invoice.cgst), ax, y, { align: "right" }); y += 5; } if (invoice.sgst && invoice.sgst > 0) { doc.text(`SGST:`, tx, y); doc.text(formatCurrencyPDF(invoice.sgst), ax, y, { align: "right" }); y += 5; } }
    if (!invoice.cgst && !invoice.sgst && !invoice.igst && invoice.tax_amount > 0) { doc.text(`GST:`, tx, y); doc.text(formatCurrencyPDF(invoice.tax_amount), ax, y, { align: "right" }); y += 5; }
  }
  doc.setDrawColor(30); doc.setLineWidth(0.5); doc.line(tx, y, ax, y); y += 5;
  const total = getTotal(invoice);
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(30); doc.text("Total:", tx, y); doc.text(formatCurrencyPDF(total), ax, y, { align: "right" }); y += 8;
  doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(120); doc.text(`${formatNumberToWords(total)} Rupees Only`, 14, y); y += 12;

  if (s.show_bank_details) {
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(100);
    let bankLine = `Bank: ${profile?.bank_name || "N/A"} | A/C: ${profile?.bank_account || "N/A"} | IFSC: ${profile?.bank_ifsc || "N/A"}`;
    if (s.show_upi && profile?.upi_id) bankLine += ` | UPI: ${profile.upi_id}`;
    doc.text(bankLine, 14, y); y += 5;
  }

  if (s.show_terms) {
    doc.setFontSize(7); doc.setTextColor(100);
    const terms = s.terms_and_conditions || "Payment due within 30 days.";
    doc.text(terms, 14, y);
  }

  if (s.show_footer_notes && s.footer_notes) { doc.setFontSize(6); doc.setTextColor(140); doc.text(s.footer_notes, 14, ph - 14); }

  doc.setFontSize(6); doc.setTextColor(160); doc.text("Powered by CaseFiles", pw / 2, ph - 10, { align: "center" });

  return doc.output("blob");
}

// ═══════════════════════════════════════════
// TEMPLATE 4: PROFESSIONAL NAVY
// ═══════════════════════════════════════════
function generateProfessional(invoice: InvoiceData, client: ClientData | null, caseData: CaseData | null, profile?: ProfileData | null): Blob {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const primary: [number, number, number] = [30, 58, 95];
  let y = 0;
  const s = getS(profile);

  doc.setFillColor(30, 58, 95); doc.rect(0, 0, pw, 40, "F");

  const firmName = profile?.firm_name || "Law Firm";
  if (s.show_firm_name) { doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(255); doc.text(firmName, 14, 18); }
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(180, 200, 220);
  if (s.show_firm_name && profile?.full_name) doc.text(profile.full_name, 14, 25);
  if (s.show_firm_phone && profile?.phone) doc.text(`Phone: ${profile.phone}`, 14, 31);
  if (s.show_firm_email && profile?.email) doc.text(profile.email, 14, 35);

  doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(255); doc.text("INVOICE", pw - 14, 18, { align: "right" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(180, 200, 220);
  doc.text(invoice.invoice_number, pw - 14, 25, { align: "right" });
  doc.text(new Date(invoice.created_at).toLocaleDateString("en-IN"), pw - 14, 31, { align: "right" });

  y = 50;

  const mid = pw / 2;
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...primary); doc.text("BILL TO", 14, y); y += 6;
  if (client) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(30); doc.text(client.full_name, 14, y); y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(80);
    if (s.show_client_company && client.company_name) { doc.text(client.company_name, 14, y); y += 4; }
    if (client.address) { doc.text(client.address, 14, y); y += 4; }
    const city = [client.city, client.state, client.pincode].filter(Boolean).join(", ");
    if (city) { doc.text(city, 14, y); y += 4; }
    if (client.email) { doc.text(client.email, 14, y); y += 4; }
    if (s.show_client_gstin && client.gst_number) { doc.text(`GSTIN: ${client.gst_number}`, 14, y); y += 4; }
  }

  let ry = 50;
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...primary); doc.text("INVOICE DETAILS", mid + 5, ry); ry += 6;
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(60);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, mid + 5, ry); ry += 4;
  if (s.show_due_date && invoice.due_date) { doc.text(`Due: ${new Date(invoice.due_date).toLocaleDateString("en-IN")}`, mid + 5, ry); ry += 4; }
  if (s.show_firm_gstin && invoice.gstin) { doc.text(`GSTIN: ${invoice.gstin}`, mid + 5, ry); ry += 4; }
  if (s.show_hsn_code && invoice.hsncode) { doc.text(`HSN/SAC: ${invoice.hsncode}`, mid + 5, ry); ry += 4; }
  if (s.show_place_of_supply && invoice.place_of_supply) { doc.text(`Place: ${invoice.place_of_supply}`, mid + 5, ry); ry += 4; }

  y = Math.max(y, ry) + 6;

  if (s.show_case_details && caseData) {
    doc.setFillColor(240, 245, 250); doc.roundedRect(14, y, pw - 28, 10, 2, 2, "F");
    doc.setFontSize(8); doc.setTextColor(...primary); doc.text(`Case: ${caseData.case_number} - ${caseData.title}`, 18, y + 6.5);
    y += 14;
  }

  const showHsn = s.show_hsn_code;
  const colW = showHsn ? [8, 82, 25, 25, 30] : [8, 107, 25, 30];
  const headers = showHsn ? ["#", "Description", "HSN/SAC", "Rate", "Amount"] : ["#", "Description", "Rate", "Amount"];
  doc.setFillColor(30, 58, 95); doc.rect(14, y, pw - 28, 8, "F");
  doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(8);
  let x = 16; for (let i = 0; i < headers.length; i++) { doc.text(headers[i], x, y + 5.5); x += colW[i]; }
  y += 8;
  doc.setTextColor(0); doc.setFont("helvetica", "normal"); doc.setFontSize(8);
  doc.setFillColor(245, 248, 252); doc.rect(14, y, pw - 28, 8, "F");
  x = 16; doc.text("1", x, y + 5.5); x += colW[0]; doc.text(invoice.description || "Legal Services", x, y + 5.5); x += colW[1];
  if (showHsn) { doc.text(invoice.hsncode || "9982", x, y + 5.5); x += colW[2]; }
  doc.text(`${invoice.gst_rate}%`, x, y + 5.5); x += colW[showHsn ? 3 : 2]; doc.text(formatCurrencyPDF(invoice.amount), x, y + 5.5);
  y += 8; doc.setDrawColor(200); doc.line(14, y, pw - 14, y); y += 8;

  const tx = pw - 80; const ax = pw - 14;
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(60);
  doc.text("Subtotal:", tx, y); doc.text(formatCurrencyPDF(invoice.amount), ax, y, { align: "right" }); y += 5;
  if (s.show_gst_breakdown) {
    if (invoice.igst && invoice.igst > 0) { doc.text(`IGST:`, tx, y); doc.text(formatCurrencyPDF(invoice.igst), ax, y, { align: "right" }); y += 5; }
    else { const h = invoice.gst_rate / 2; if (invoice.cgst && invoice.cgst > 0) { doc.text(`CGST:`, tx, y); doc.text(formatCurrencyPDF(invoice.cgst), ax, y, { align: "right" }); y += 5; } if (invoice.sgst && invoice.sgst > 0) { doc.text(`SGST:`, tx, y); doc.text(formatCurrencyPDF(invoice.sgst), ax, y, { align: "right" }); y += 5; } }
    if (!invoice.cgst && !invoice.sgst && !invoice.igst && invoice.tax_amount > 0) { doc.text(`GST:`, tx, y); doc.text(formatCurrencyPDF(invoice.tax_amount), ax, y, { align: "right" }); y += 5; }
  }
  doc.setFillColor(30, 58, 95); doc.rect(tx - 2, y, ax - tx + 4, 0.8, "F"); y += 6;
  const total = getTotal(invoice);
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...primary); doc.text("Total:", tx, y); doc.text(formatCurrencyPDF(total), ax, y, { align: "right" }); y += 8;
  doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(100); doc.text(`Amount in Words: ${formatNumberToWords(total)} Rupees Only`, 14, y); y += 10;

  if (s.show_bank_details) {
    doc.setFillColor(245, 248, 252); doc.roundedRect(14, y, pw - 28, 20, 2, 2, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...primary); doc.text("BANK DETAILS", 18, y + 6);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(80);
    doc.text(`Bank: ${profile?.bank_name || "[Bank Name]"}`, 18, y + 12);
    doc.text(`A/C: ${profile?.bank_account || "[Account Number]"}`, 18, y + 16);
    doc.text(`IFSC: ${profile?.bank_ifsc || "[IFSC]"}`, pw / 2, y + 12);
    if (s.show_upi) doc.text(`UPI: ${profile?.upi_id || "[UPI ID]"}`, pw / 2, y + 16);
    y += 24;
  }

  if (s.show_terms) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...primary); doc.text("TERMS", 14, y); y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(80);
    doc.text(s.terms_and_conditions || "Payment due within 30 days.", 14, y); y += 8;
  }

  if (s.show_footer_notes && s.footer_notes) { doc.setFontSize(7); doc.setTextColor(100); doc.text(s.footer_notes, 14, y); }

  doc.setFillColor(30, 58, 95); doc.rect(0, ph - 12, pw, 12, "F");
  doc.setFontSize(7); doc.setTextColor(200); doc.text("Powered by CaseFiles Legal Practice Management", pw / 2, ph - 5, { align: "center" });

  return doc.output("blob");
}

// ═══════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════
export function generateInvoicePDF(
  invoice: InvoiceData,
  client: ClientData | null,
  caseData: CaseData | null,
  profile?: ProfileData | null,
  templateId: InvoiceTemplateId = "classic"
): Blob {
  switch (templateId) {
    case "modern": return generateModern(invoice, client, caseData, profile);
    case "minimal": return generateMinimal(invoice, client, caseData, profile);
    case "professional": return generateProfessional(invoice, client, caseData, profile);
    default: return generateClassic(invoice, client, caseData, profile);
  }
}
