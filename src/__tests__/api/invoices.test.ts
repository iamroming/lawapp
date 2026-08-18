import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/firebase/auth", () => ({
  verifySessionFromRequest: vi.fn(),
}));

import { GET, POST } from "@/app/api/invoices/route";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/invoices", () => {
  it("returns 401 when not authenticated", async () => {
    (verifySessionFromRequest as any).mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/invoices"));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/invoices", () => {
  it("returns 401 when not authenticated", async () => {
    (verifySessionFromRequest as any).mockResolvedValue(null);
    const req = new Request("http://localhost/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 50000 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("rejects missing client_id", async () => {
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
    const req = new Request("http://localhost/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 50000 }),
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
    const req = new Request("http://localhost/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: "550e8400-e29b-41d4-a716-446655440000", amount: 0 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
