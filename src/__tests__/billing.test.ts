import { describe, it, expect } from "vitest";
import {
  calculateGST,
  calculateTDS,
  getCurrentFinancialYear,
  getCurrentQuarter,
  formatInvoiceNumber,
  calculateAging,
  TDS_RATES,
  INDIAN_STATES,
  STATE_CODES,
  LEGAL_HSN_CODES,
} from "@/lib/india/billing";

describe("calculateGST", () => {
  it("calculates intra-state GST (CGST + SGST)", () => {
    const result = calculateGST(100000, "MH", "MH", 18);
    expect(result.isInterState).toBe(false);
    expect(result.cgst).toBe(9000);
    expect(result.sgst).toBe(9000);
    expect(result.igst).toBe(0);
    expect(result.totalTax).toBe(18000);
    expect(result.totalAmount).toBe(118000);
  });

  it("calculates inter-state GST (IGST)", () => {
    const result = calculateGST(100000, "MH", "DL", 18);
    expect(result.isInterState).toBe(true);
    expect(result.cgst).toBe(0);
    expect(result.sgst).toBe(0);
    expect(result.igst).toBe(18000);
    expect(result.totalTax).toBe(18000);
    expect(result.totalAmount).toBe(118000);
  });

  it("uses default 18% rate", () => {
    const result = calculateGST(10000, "KA", "KA");
    expect(result.gstRate).toBe(18);
    expect(result.totalTax).toBe(1800);
    expect(result.cgst).toBe(900);
    expect(result.sgst).toBe(900);
  });

  it("handles custom GST rate", () => {
    const result = calculateGST(10000, "KA", "KA", 12);
    expect(result.gstRate).toBe(12);
    expect(result.cgst).toBe(600);
    expect(result.sgst).toBe(600);
  });

  it("handles zero amount", () => {
    const result = calculateGST(0, "MH", "MH");
    expect(result.totalTax).toBe(0);
    expect(result.totalAmount).toBe(0);
  });
});

describe("calculateTDS", () => {
  it("returns no TDS for individual under 30k", () => {
    const result = calculateTDS(25000, "individual");
    expect(result.tdsRate).toBe(0);
    expect(result.tdsAmount).toBe(0);
    expect(result.netAmount).toBe(25000);
  });

  it("deducts TDS for individual over 50k", () => {
    const result = calculateTDS(100000, "individual", true);
    expect(result.tdsRate).toBe(TDS_RATES.SECTION_194J_PROFESSIONAL);
    expect(result.tdsAmount).toBe(10000);
    expect(result.netAmount).toBe(90000);
  });

  it("deducts TDS for company on any amount", () => {
    const result = calculateTDS(10000, "company", true);
    expect(result.tdsRate).toBe(TDS_RATES.SECTION_194J_PROFESSIONAL);
    expect(result.tdsAmount).toBe(1000);
    expect(result.netAmount).toBe(9000);
  });

  it("uses 20% when PAN not available", () => {
    const result = calculateTDS(100000, "company", false);
    expect(result.tdsRate).toBe(20);
    expect(result.tdsAmount).toBe(20000);
    expect(result.netAmount).toBe(80000);
  });
});

describe("getCurrentFinancialYear", () => {
  it("returns FY in correct format", () => {
    const fy = getCurrentFinancialYear();
    expect(fy).toMatch(/^\d{4}-\d{2}$/);
  });
});

describe("getCurrentQuarter", () => {
  it("returns valid quarter", () => {
    const q = getCurrentQuarter();
    expect(["Q1", "Q2", "Q3", "Q4"]).toContain(q);
  });
});

describe("formatInvoiceNumber", () => {
  it("formats invoice number with prefix and sequence", () => {
    const result = formatInvoiceNumber("INV", 1);
    expect(result).toMatch(/^INV\/\d{4}-\d{2}\/0001$/);
  });

  it("pads sequence to 4 digits", () => {
    const result = formatInvoiceNumber("BILL", 42);
    expect(result).toContain("0042");
  });
});

describe("calculateAging", () => {
  it("returns current for future due date", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const result = calculateAging(futureDate.toISOString().split("T")[0]);
    expect(result.bucket).toBe("current");
    expect(result.daysOverdue).toBe(0);
  });

  it("returns 30-day bucket for overdue", () => {
    const date = new Date();
    date.setDate(date.getDate() - 15);
    const result = calculateAging(date.toISOString().split("T")[0]);
    expect(result.bucket).toBe("30");
    expect(result.daysOverdue).toBeGreaterThanOrEqual(15);
    expect(result.daysOverdue).toBeLessThanOrEqual(16);
  });

  it("returns 60-day bucket for 45 days overdue", () => {
    const date = new Date();
    date.setDate(date.getDate() - 45);
    const result = calculateAging(date.toISOString().split("T")[0]);
    expect(result.bucket).toBe("60");
  });

  it("returns 90-day bucket for 75 days overdue", () => {
    const date = new Date();
    date.setDate(date.getDate() - 75);
    const result = calculateAging(date.toISOString().split("T")[0]);
    expect(result.bucket).toBe("90");
  });

  it("returns 90+ bucket for 120 days overdue", () => {
    const date = new Date();
    date.setDate(date.getDate() - 120);
    const result = calculateAging(date.toISOString().split("T")[0]);
    expect(result.bucket).toBe("90+");
  });
});

describe("constants", () => {
  it("has all Indian states", () => {
    expect(Object.keys(INDIAN_STATES).length).toBeGreaterThanOrEqual(35);
  });

  it("has state codes for all states", () => {
    for (const stateCode of Object.keys(INDIAN_STATES)) {
      expect(STATE_CODES[stateCode]).toBeDefined();
    }
  });

  it("has legal HSN codes", () => {
    expect(LEGAL_HSN_CODES.LEGAL_SERVICES).toBe("9982");
    expect(LEGAL_HSN_CODES.LITIGATION).toBe("998221");
  });
});
