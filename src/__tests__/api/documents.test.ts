import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/firebase/auth", () => ({
  verifySessionFromRequest: vi.fn(),
}));

import { GET, POST } from "@/app/api/documents/route";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/documents", () => {
  it("returns 401 when not authenticated", async () => {
    (verifySessionFromRequest as any).mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/documents"));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/documents", () => {
  it("returns 401 when not authenticated", async () => {
    (verifySessionFromRequest as any).mockResolvedValue(null);
    const req = new Request("http://localhost/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Petition Draft" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("rejects empty title", async () => {
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
    const req = new Request("http://localhost/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
