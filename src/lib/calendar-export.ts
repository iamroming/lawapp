import jsPDF from "jspdf";
import * as XLSX from "xlsx";

interface CalendarExportEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: "hearing" | "rule" | "event";
  description?: string;
  court?: string;
  judge_name?: string;
  case_number?: string;
  is_completed?: boolean;
}

const TYPE_LABELS = { hearing: "Hearing", rule: "Court Rule", event: "Event" };
const TYPE_COLORS: Record<string, [number, number, number]> = {
  hearing: [59, 130, 246],
  rule: [245, 158, 11],
  event: [16, 185, 129],
};

function groupByDate(events: CalendarExportEvent[]): Map<string, CalendarExportEvent[]> {
  const grouped = new Map<string, CalendarExportEvent[]>();
  const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  for (const event of sorted) {
    const dateKey = new Date(event.date).toLocaleDateString("en-IN", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    if (!grouped.has(dateKey)) grouped.set(dateKey, []);
    grouped.get(dateKey)!.push(event);
  }
  return grouped;
}

export function generateCalendarPDF(events: CalendarExportEvent[], monthYear: string): Blob {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const grouped = groupByDate(events);

  // Header
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("CaseFiles Calendar", 15, 15);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(monthYear, 15, 23);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")} | ${events.length} events`, pageWidth - 70, 23);

  // Legend
  let y = 42;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Legend:", 15, y);
  let lx = 32;
  for (const [type, label] of Object.entries(TYPE_LABELS)) {
    const [r, g, b] = TYPE_COLORS[type];
    doc.setFillColor(r, g, b);
    doc.circle(lx, y - 1.5, 2, "F");
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    doc.text(label, lx + 4, y);
    lx += label.length * 2.5 + 12;
  }

  // Stats
  y += 8;
  const hearings = events.filter((e) => e.type === "hearing").length;
  const rules = events.filter((e) => e.type === "rule").length;
  const evts = events.filter((e) => e.type === "event").length;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Total: ${events.length} events | ${hearings} hearings | ${rules} rules | ${evts} events`, 15, y);

  y += 10;

  // Events grouped by date
  grouped.forEach((dayEvents, dateLabel) => {
    // Check page break
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 20;
    }

    // Date header
    doc.setFillColor(245, 245, 245);
    doc.rect(12, y - 4, pageWidth - 24, 8, "F");
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.5);
    doc.line(12, y - 4, 12, y + 4);
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(dateLabel, 16, y + 1);
    y += 10;

    for (const event of dayEvents) {
      if (y > pageHeight - 25) {
        doc.addPage();
        y = 20;
      }

      const [r, g, b] = TYPE_COLORS[event.type] || [100, 100, 100];

      // Color dot
      doc.setFillColor(r, g, b);
      doc.circle(17, y + 1, 2, "F");

      // Type badge
      doc.setFontSize(7);
      doc.setTextColor(r, g, b);
      doc.setFont("helvetica", "bold");
      doc.text(TYPE_LABELS[event.type].toUpperCase(), 22, y + 1.5);

      // Time
      if (event.time) {
        doc.setTextColor(120, 120, 120);
        doc.setFont("helvetica", "normal");
        doc.text(event.time, 42, y + 1.5);
      }

      // Title
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      const timeX = event.time ? 58 : 22;
      doc.text(event.title.substring(0, 70), timeX, y + 1.5);

      // Completed indicator
      if (event.is_completed) {
        doc.setTextColor(16, 185, 129);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text("[COMPLETED]", pageWidth - 30, y + 1.5);
      }

      y += 5;

      // Details line
      const details: string[] = [];
      if (event.case_number) details.push(`Case: ${event.case_number}`);
      if (event.court) details.push(`Court: ${event.court}`);
      if (event.judge_name) details.push(`Judge: ${event.judge_name}`);
      if (event.description) details.push(event.description);

      if (details.length > 0) {
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "normal");
        const detailText = details.join(" | ").substring(0, 120);
        doc.text(detailText, 22, y);
        y += 4;
      }

      y += 2;
    }

    y += 4;
  });

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`CaseFiles Calendar | Page ${i} of ${totalPages} | Printed: ${new Date().toLocaleDateString("en-IN")}`, pageWidth / 2, pageHeight - 8, { align: "center" });
  }

  return doc.output("blob");
}

export function generateCalendarExcel(events: CalendarExportEvent[], monthYear: string): Buffer {
  const rows = events.map((e) => ({
    Date: new Date(e.date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    Time: e.time || "",
    Type: TYPE_LABELS[e.type],
    Title: e.title,
    "Case Number": e.case_number || "",
    Court: e.court || "",
    Judge: e.judge_name || "",
    Description: e.description || "",
    Status: e.is_completed ? "Completed" : "Pending",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Calendar");

  // Summary sheet
  const hearings = events.filter((e) => e.type === "hearing").length;
  const rules = events.filter((e) => e.type === "rule").length;
  const evts = events.filter((e) => e.type === "event").length;
  const completed = events.filter((e) => e.is_completed).length;

  const summaryData = [
    { Summary: "Calendar Export", Value: monthYear },
    { Summary: "Total Events", Value: events.length },
    { Summary: "Hearings", Value: hearings },
    { Summary: "Court Rules", Value: rules },
    { Summary: "Events", Value: evts },
    { Summary: "Completed", Value: completed },
    { Summary: "Pending", Value: events.length - completed },
    { Summary: "Generated", Value: new Date().toLocaleDateString("en-IN") },
  ];
  const ws2 = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, ws2, "Summary");

  // Auto-fit column widths
  const colWidths = Object.keys(rows[0] || {}).map((key) => ({
    wch: Math.max(key.length, 18),
  }));
  ws["!cols"] = colWidths;

  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

export function generateCalendarICS(events: CalendarExportEvent[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CaseFiles//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:CaseFiles Calendar",
  ];

  for (const event of events) {
    const dt = new Date(event.date);
    const dtEnd = new Date(dt.getTime() + 60 * 60 * 1000); // 1 hour duration
    const formatDate = (d: Date) =>
      d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

    const typeLabel = TYPE_LABELS[event.type];
    const description = [
      event.description,
      event.case_number ? `Case: ${event.case_number}` : "",
      event.court ? `Court: ${event.court}` : "",
      event.judge_name ? `Judge: ${event.judge_name}` : "",
      event.is_completed ? "Status: Completed" : "",
    ].filter(Boolean).join("\\n");

    lines.push(
      "BEGIN:VEVENT",
      `DTSTART:${formatDate(dt)}`,
      `DTEND:${formatDate(dtEnd)}`,
      `SUMMARY:[${typeLabel}] ${event.title}`,
      description ? `DESCRIPTION:${description}` : "",
      `UID:${event.id}@casefiles`,
      `CATEGORIES:${typeLabel}`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.filter(Boolean).join("\r\n");
}
