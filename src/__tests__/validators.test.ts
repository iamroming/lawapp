import { describe, it, expect } from "vitest";
import {
  loginSchema,
  signupSchema,
  clientSchema,
  caseSchema,
  hearingSchema,
  invoiceSchema,
  timeEntrySchema,
  paymentSchema,
  documentSchema,
  reminderSchema,
} from "@/lib/validators";

describe("loginSchema", () => {
  it("accepts valid login", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "123456" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "123456" });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "123" });
    expect(result.success).toBe(false);
  });
});

describe("signupSchema", () => {
  it("accepts valid signup", () => {
    const result = signupSchema.safeParse({
      fullName: "Advocate Sharma",
      email: "sharma@law.com",
      phone: "9876543210",
      password: "StrongPass1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects password without uppercase", () => {
    const result = signupSchema.safeParse({
      fullName: "Test",
      email: "t@t.com",
      phone: "9876543210",
      password: "nouppercase1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without number", () => {
    const result = signupSchema.safeParse({
      fullName: "Test",
      email: "t@t.com",
      phone: "9876543210",
      password: "NoNumberHere",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short phone", () => {
    const result = signupSchema.safeParse({
      fullName: "Test",
      email: "t@t.com",
      phone: "12345",
      password: "StrongPass1",
    });
    expect(result.success).toBe(false);
  });
});

describe("clientSchema", () => {
  it("accepts valid client", () => {
    const result = clientSchema.safeParse({
      full_name: "Rajesh Kumar",
      phone: "9876543210",
    });
    expect(result.success).toBe(true);
  });

  it("accepts client with GST number", () => {
    const result = clientSchema.safeParse({
      full_name: "Acme Corp",
      phone: "9876543210",
      company_name: "Acme Corp Pvt Ltd",
      gst_number: "27AAPFU0939F1ZV",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid GST number", () => {
    const result = clientSchema.safeParse({
      full_name: "Acme Corp",
      phone: "9876543210",
      gst_number: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid pincode", () => {
    const result = clientSchema.safeParse({
      full_name: "Test",
      phone: "9876543210",
      pincode: "123",
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty email", () => {
    const result = clientSchema.safeParse({
      full_name: "Test",
      phone: "9876543210",
      email: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("caseSchema", () => {
  it("accepts valid case", () => {
    const result = caseSchema.safeParse({
      title: "Rajesh vs State of Maharashtra",
      case_type: "criminal",
    });
    expect(result.success).toBe(true);
  });

  it("sets default priority to medium", () => {
    const result = caseSchema.safeParse({
      title: "Test Case",
      case_type: "civil",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe("medium");
    }
  });

  it("rejects short title", () => {
    const result = caseSchema.safeParse({
      title: "Ab",
      case_type: "criminal",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all priority levels", () => {
    for (const priority of ["low", "medium", "high", "urgent"]) {
      const result = caseSchema.safeParse({
        title: "Test Case",
        case_type: "civil",
        priority,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid priority", () => {
    const result = caseSchema.safeParse({
      title: "Test Case",
      case_type: "civil",
      priority: "critical",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional total_fee as zero", () => {
    const result = caseSchema.safeParse({
      title: "Test Case",
      case_type: "civil",
      total_fee: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative total_fee", () => {
    const result = caseSchema.safeParse({
      title: "Test Case",
      case_type: "civil",
      total_fee: -100,
    });
    expect(result.success).toBe(false);
  });
});

describe("hearingSchema", () => {
  it("accepts valid hearing", () => {
    const result = hearingSchema.safeParse({
      case_id: "550e8400-e29b-41d4-a716-446655440000",
      hearing_date: "2026-08-15",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID", () => {
    const result = hearingSchema.safeParse({
      case_id: "not-a-uuid",
      hearing_date: "2026-08-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty date", () => {
    const result = hearingSchema.safeParse({
      case_id: "550e8400-e29b-41d4-a716-446655440000",
      hearing_date: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("invoiceSchema", () => {
  it("accepts valid invoice", () => {
    const result = invoiceSchema.safeParse({
      amount: 50000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero amount", () => {
    const result = invoiceSchema.safeParse({ amount: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = invoiceSchema.safeParse({ amount: -100 });
    expect(result.success).toBe(false);
  });

  it("accepts GST rate 0-100", () => {
    const result = invoiceSchema.safeParse({ amount: 1000, gst_rate: 18 });
    expect(result.success).toBe(true);
  });

  it("rejects GST rate > 100", () => {
    const result = invoiceSchema.safeParse({ amount: 1000, gst_rate: 150 });
    expect(result.success).toBe(false);
  });
});

describe("paymentSchema", () => {
  it("accepts valid payment", () => {
    const result = paymentSchema.safeParse({
      amount: 10000,
      payment_method: "upi",
      payment_date: "2026-08-01",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all payment methods", () => {
    for (const method of ["cash", "bank_transfer", "upi", "cheque", "card", "other"]) {
      const result = paymentSchema.safeParse({
        amount: 1000,
        payment_method: method,
        payment_date: "2026-08-01",
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid payment method", () => {
    const result = paymentSchema.safeParse({
      amount: 1000,
      payment_method: "bitcoin",
      payment_date: "2026-08-01",
    });
    expect(result.success).toBe(false);
  });
});

describe("documentSchema", () => {
  it("accepts valid document", () => {
    const result = documentSchema.safeParse({
      title: "Petition Draft",
    });
    expect(result.success).toBe(true);
  });

  it("sets default category to other", () => {
    const result = documentSchema.safeParse({ title: "Test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("other");
    }
  });

  it("accepts all categories", () => {
    for (const cat of ["petition", "affidavit", "evidence", "judgment", "agreement", "correspondence", "other"]) {
      const result = documentSchema.safeParse({ title: "Test", category: cat });
      expect(result.success).toBe(true);
    }
  });
});

describe("timeEntrySchema", () => {
  it("accepts valid time entry", () => {
    const result = timeEntrySchema.safeParse({
      description: "Drafted petition",
      hours: 2.5,
      date: "2026-08-01",
    });
    expect(result.success).toBe(true);
  });

  it("sets default is_billable to true", () => {
    const result = timeEntrySchema.safeParse({
      description: "Research",
      hours: 1,
      date: "2026-08-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_billable).toBe(true);
    }
  });

  it("rejects hours < 0.5", () => {
    const result = timeEntrySchema.safeParse({
      description: "Quick call",
      hours: 0.1,
      date: "2026-08-01",
    });
    expect(result.success).toBe(false);
  });
});

describe("reminderSchema", () => {
  it("accepts valid reminder", () => {
    const result = reminderSchema.safeParse({
      title: "File counter affidavit",
      reminder_date: "2026-08-10",
    });
    expect(result.success).toBe(true);
  });

  it("sets default type to custom", () => {
    const result = reminderSchema.safeParse({
      title: "Test",
      reminder_date: "2026-08-10",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("custom");
    }
  });

  it("accepts all reminder types", () => {
    for (const type of ["hearing", "deadline", "payment", "follow_up", "custom"]) {
      const result = reminderSchema.safeParse({
        title: "Test",
        reminder_date: "2026-08-10",
        type,
      });
      expect(result.success).toBe(true);
    }
  });
});
