export function shareOnWhatsApp(text: string, phoneNumber?: string): void {
  const encoded = encodeURIComponent(text);
  const url = phoneNumber
    ? `https://wa.me/${phoneNumber}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  window.open(url, "_blank");
}

export function shareFileOnWhatsApp(
  fileName: string,
  fileUrl: string,
  message: string,
  phoneNumber?: string
): void {
  const text = `${message}\n\n📄 ${fileName}\n🔗 ${fileUrl}`;
  shareOnWhatsApp(text, phoneNumber);
}

export function buildInvoiceShareText(invoice: {
  case_number: string;
  client_name: string;
  amount: number;
  due_date?: string;
}): string {
  const lines = [
    `📋 Invoice — ${invoice.case_number}`,
    `Client: ${invoice.client_name}`,
    `Amount: ₹${invoice.amount.toLocaleString("en-IN")}`,
  ];
  if (invoice.due_date) lines.push(`Due: ${invoice.due_date}`);
  lines.push("", "Please find the invoice attached.");
  return lines.join("\n");
}

export function buildCaseShareText(caseData: {
  case_number: string;
  title: string;
  court?: string;
  next_hearing?: string;
}): string {
  const lines = [
    `⚖️ Case: ${caseData.case_number}`,
    `${caseData.title}`,
  ];
  if (caseData.court) lines.push(`Court: ${caseData.court}`);
  if (caseData.next_hearing) lines.push(`Next Hearing: ${caseData.next_hearing}`);
  return lines.join("\n");
}

export function buildQuotationShareText(quotation: {
  quotation_number: string;
  client_name: string;
  total_amount: number;
  valid_until?: string;
}): string {
  const lines = [
    `💰 Quotation — ${quotation.quotation_number}`,
    `Client: ${quotation.client_name}`,
    `Amount: ₹${quotation.total_amount.toLocaleString("en-IN")}`,
  ];
  if (quotation.valid_until) lines.push(`Valid Until: ${quotation.valid_until}`);
  lines.push("", "Please find the quotation attached.");
  return lines.join("\n");
}
