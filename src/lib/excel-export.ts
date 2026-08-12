import * as XLSX from "xlsx";

export function generateCasesExcel(cases: any[]): Buffer {
  const data = cases.map((c) => ({
    "Case Number": c.case_number || "",
    Title: c.title || "",
    Type: c.case_type || "",
    Status: c.status || "",
    Court: c.court || "",
    Judge: c.judge_name || "",
    Client: c.client?.full_name || "",
    "Filing Date": c.filing_date || "",
    "Next Hearing": c.next_hearing_date || "",
    "Total Fee": c.total_fee || 0,
    "Amount Received": c.amount_received || 0,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Cases");

  // Auto-fit column widths
  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.max(key.length, 15),
  }));
  ws["!cols"] = colWidths;

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

export function generateClientsExcel(clients: any[]): Buffer {
  const data = clients.map((c) => ({
    Name: c.full_name || "",
    Email: c.email || "",
    Phone: c.phone || "",
    Address: c.address || "",
    "Case Count": c.case_count || 0,
    "Created At": c.created_at || "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Clients");

  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.max(key.length, 15),
  }));
  ws["!cols"] = colWidths;

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

export function generateBillingExcel(cases: any[]): Buffer {
  const data = cases.map((c) => ({
    "Case Number": c.case_number || "",
    Title: c.title || "",
    Client: c.client?.full_name || "",
    Status: c.status || "",
    "Total Fee": c.total_fee || 0,
    "Amount Received": c.amount_received || 0,
    Pending: (c.total_fee || 0) - (c.amount_received || 0),
    "Collection Rate": c.total_fee
      ? `${Math.round(((c.amount_received || 0) / c.total_fee) * 100)}%`
      : "0%",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Billing");

  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.max(key.length, 15),
  }));
  ws["!cols"] = colWidths;

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

export function generateReportsExcel(data: {
  cases: any[];
  summary: Record<string, any>;
}): Buffer {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = Object.entries(data.summary).map(([key, value]) => ({
    Metric: key,
    Value: value,
  }));
  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

  // Cases sheet
  if (data.cases.length > 0) {
    const casesData = data.cases.map((c) => ({
      "Case Number": c.case_number || "",
      Title: c.title || "",
      Status: c.status || "",
      "Total Fee": c.total_fee || 0,
      "Amount Received": c.amount_received || 0,
    }));
    const casesWs = XLSX.utils.json_to_sheet(casesData);
    XLSX.utils.book_append_sheet(wb, casesWs, "Cases");
  }

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
