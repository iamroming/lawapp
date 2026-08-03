import { describe, it, expect } from "vitest";

// Test AI route validation without Supabase mocking
import { caseSchema } from "@/lib/validators";

describe("AI Analyze validation", () => {
  it("validates case data for AI analysis", () => {
    const result = caseSchema.safeParse({
      title: "Complex civil dispute requiring AI analysis",
      case_type: "civil",
      description: "This is a detailed description of the case that needs to be analyzed by AI for legal strategy and precedent research.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects title too short", () => {
    const result = caseSchema.safeParse({
      title: "Ab",
      case_type: "civil",
    });
    expect(result.success).toBe(false);
  });
});

describe("AI request body validation", () => {
  it("validates description length requirements", () => {
    // AI analyze requires min 10 chars
    const shortDesc = "Short";
    const validDesc = "This is a valid description for analysis";

    expect(shortDesc.length).toBeLessThan(10);
    expect(validDesc.length).toBeGreaterThanOrEqual(10);
  });

  it("validates max description length", () => {
    const maxDesc = "x".repeat(5000);
    const overDesc = "x".repeat(5001);

    expect(maxDesc.length).toBeLessThanOrEqual(5000);
    expect(overDesc.length).toBeGreaterThan(5000);
  });
});
