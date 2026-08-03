import { describe, it, expect, beforeAll } from "vitest";
import crypto from "crypto";

// Set env before importing
process.env.CSRF_SECRET = "test-secret-for-csrf";

let generateCsrfToken: () => string;
let validateCsrfToken: (token: string) => boolean;

beforeAll(async () => {
  const mod = await import("@/lib/csrf");
  generateCsrfToken = mod.generateCsrfToken;
  validateCsrfToken = mod.validateCsrfToken;
});

describe("CSRF Token Generation", () => {
  it("generates token in format token.signature", () => {
    const token = generateCsrfToken();
    const parts = token.split(".");
    expect(parts.length).toBe(2);
    expect(parts[0]).toHaveLength(64);
    expect(parts[1]).toHaveLength(64);
  });

  it("generates unique tokens each time", () => {
    const t1 = generateCsrfToken();
    const t2 = generateCsrfToken();
    expect(t1).not.toBe(t2);
  });
});

describe("CSRF Token Validation", () => {
  it("validates a generated token", () => {
    const token = generateCsrfToken();
    expect(validateCsrfToken(token)).toBe(true);
  });

  it("rejects invalid token format", () => {
    expect(validateCsrfToken("invalid")).toBe(false);
    expect(validateCsrfToken("a.b.c")).toBe(false);
    expect(validateCsrfToken("")).toBe(false);
  });

  it("rejects token with wrong signature", () => {
    const token = generateCsrfToken();
    const parts = token.split(".");
    const tampered = `${parts[0]}.0000000000000000000000000000000000000000000000000000000000000000`;
    expect(validateCsrfToken(tampered)).toBe(false);
  });

  it("rejects token with different secret", () => {
    const fakeTokenValue = crypto.randomBytes(32).toString("hex");
    const fakeSig = crypto
      .createHmac("sha256", "wrong-secret")
      .update(fakeTokenValue)
      .digest("hex");
    expect(validateCsrfToken(`${fakeTokenValue}.${fakeSig}`)).toBe(false);
  });
});
