import { describe, it, expect } from "vitest";

// Test client schema validation only (no Supabase mocking needed)
import { clientSchema, caseSchema, hearingSchema, invoiceSchema, paymentSchema } from "@/lib/validators";

describe("Client API validation", () => {
  it("validates complete client data", () => {
    const result = clientSchema.safeParse({
      full_name: "Rajesh Kumar",
      phone: "9876543210",
      email: "rajesh@email.com",
      company_name: "Gupta Industries",
      gst_number: "27AAPFU0939F1ZV",
      address: "123 MG Road",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      id_type: "pan",
      id_number: "AAPFU0939F",
    });
    expect(result.success).toBe(true);
  });

  it("rejects client with short name", () => {
    const result = clientSchema.safeParse({
      full_name: "R",
      phone: "9876543210",
    });
    expect(result.success).toBe(false);
  });
});

describe("Case API validation", () => {
  it("validates complete case data", () => {
    const result = caseSchema.safeParse({
      title: "Rajesh vs State of Maharashtra",
      case_type: "criminal",
      court: "Bombay High Court",
      priority: "high",
      opposing_party: "State",
      total_fee: 150000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects case without type", () => {
    const result = caseSchema.safeParse({
      title: "Test Case",
    });
    expect(result.success).toBe(false);
  });
});

describe("Hearing API validation", () => {
  it("validates hearing with UUID case_id", () => {
    const result = hearingSchema.safeParse({
      case_id: "550e8400-e29b-41d4-a716-446655440000",
      hearing_date: "2026-08-15",
      purpose: "Final arguments",
    });
    expect(result.success).toBe(true);
  });

  it("rejects hearing without case_id", () => {
    const result = hearingSchema.safeParse({
      hearing_date: "2026-08-15",
    });
    expect(result.success).toBe(false);
  });
});

describe("Invoice API validation", () => {
  it("validates invoice with amount", () => {
    const result = invoiceSchema.safeParse({
      amount: 50000,
      description: "Legal consultation",
      gst_rate: 18,
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero amount", () => {
    const result = invoiceSchema.safeParse({ amount: 0 });
    expect(result.success).toBe(false);
  });
});

describe("Payment API validation", () => {
  it("validates complete payment", () => {
    const result = paymentSchema.safeParse({
      amount: 10000,
      payment_method: "upi",
      payment_date: "2026-08-01",
      reference_number: "UPI/TXN/001",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid payment method", () => {
    const result = paymentSchema.safeParse({
      amount: 10000,
      payment_method: "bitcoin",
      payment_date: "2026-08-01",
    });
    expect(result.success).toBe(false);
  });
});
