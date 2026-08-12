import jsPDF from "jspdf";

export function generateCasesPDF(cases: any[], firmName?: string): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text(firmName || "CaseFiles", 20, 20);
  doc.setFontSize(12);
  doc.text("Cases Report", 20, 30);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, pageWidth - 60, 30);

  // Table header
  let y = 50;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(240, 240, 240);
  doc.rect(10, y - 5, pageWidth - 20, 8, "F");
  doc.text("Case No.", 12, y);
  doc.text("Title", 45, y);
  doc.text("Client", 110, y);
  doc.text("Court", 140, y);
  doc.text("Status", 170, y);

  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  for (const c of cases) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(String(c.case_number || "").substring(0, 18), 12, y);
    doc.text(String(c.title || "").substring(0, 30), 45, y);
    doc.text(String(c.client?.full_name || "—").substring(0, 18), 110, y);
    doc.text(String(c.court || "—").substring(0, 15), 140, y);
    doc.text(String(c.status || ""), 170, y);
    y += 7;
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, 290, { align: "center" });
  }

  return doc.output("blob");
}

export function generateClientsPDF(clients: any[], firmName?: string): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text(firmName || "CaseFiles", 20, 20);
  doc.setFontSize(12);
  doc.text("Clients Directory", 20, 30);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, pageWidth - 60, 30);

  let y = 50;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(240, 240, 240);
  doc.rect(10, y - 5, pageWidth - 20, 8, "F");
  doc.text("Name", 12, y);
  doc.text("Email", 60, y);
  doc.text("Phone", 110, y);
  doc.text("Cases", 145, y);

  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  for (const c of clients) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(String(c.full_name || "").substring(0, 25), 12, y);
    doc.text(String(c.email || "—").substring(0, 25), 60, y);
    doc.text(String(c.phone || "—").substring(0, 15), 110, y);
    doc.text(String(c.case_count || 0), 145, y);
    y += 7;
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, 290, { align: "center" });
  }

  return doc.output("blob");
}

export function generateReportsPDF(data: {
  title: string;
  summary: { label: string; value: string | number }[];
  rows: { cells: string[] }[];
  headers: string[];
}, firmName?: string): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text(firmName || "CaseFiles", 20, 20);
  doc.setFontSize(12);
  doc.text(data.title, 20, 30);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, pageWidth - 60, 30);

  // Summary cards
  let y = 50;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  const cardWidth = (pageWidth - 30) / data.summary.length;
  data.summary.forEach((s, i) => {
    const x = 10 + i * cardWidth;
    doc.setFillColor(245, 245, 255);
    doc.roundedRect(x, y, cardWidth - 5, 18, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(String(s.value), x + 5, y + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(s.label, x + 5, y + 15);
  });

  y += 25;

  // Table
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(240, 240, 240);
  doc.rect(10, y - 5, pageWidth - 20, 7, "F");
  const colWidth = (pageWidth - 20) / data.headers.length;
  data.headers.forEach((h, i) => {
    doc.text(h, 12 + i * colWidth, y);
  });

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  for (const row of data.rows) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    row.cells.forEach((cell, i) => {
      doc.text(String(cell).substring(0, Math.floor(colWidth / 2)), 12 + i * colWidth, y);
    });
    y += 6;
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, 290, { align: "center" });
  }

  return doc.output("blob");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
