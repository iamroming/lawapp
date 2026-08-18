import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/firebase/auth", () => ({
  verifySessionFromRequest: vi.fn(),
}));

import { GET, POST } from "@/app/api/payments/route";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/payments", () => {
  it("returns 401 when not authenticated", async () => {
    (verifySessionFromRequest as any).mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/payments"));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/payments", () => {
  it("returns 401 when not authenticated", async () => {
    (verifySessionFromRequest as any).mockResolvedValue(null);
    const req = new Request("http://localhost/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 10000, payment_method: "upi", payment_date: "2026-08-01" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("rejects invalid payment method", async () => {
    (verifySessionFromRequest as any).mockResolvedValue({
      uid: "user-1",
      uuid: "user-1",
      email: "user@test.com",
      displayName: "Test User",
    });
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "user-1", role: "owner", firm_id: "firm-1" }, error: null }),
    };
    (createClient as any).mockResolvedValue({
      from: vi.fn().mockReturnValue(mockChain),
    });
    const req = new Request("http://localhost/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 10000, payment_method: "bitcoin", payment_date: "2026-08-01" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects zero amount", async () => {
    (verifySessionFromRequest as any).mockResolvedValue({
      uid: "user-1",
      uuid: "user-1",
      email: "user@test.com",
      displayName: "Test User",
    });
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "user-1", role: "owner", firm_id: "firm-1" }, error: null }),
    };
    (createClient as any).mockResolvedValue({
      from: vi.fn().mockReturnValue(mockChain),
    });
    const req = new Request("http://localhost/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 0, payment_method: "upi", payment_date: "2026-08-01" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
