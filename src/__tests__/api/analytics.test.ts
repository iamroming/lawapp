import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/firebase/auth", () => ({
  verifySessionFromRequest: vi.fn(),
}));

import { GET } from "@/app/api/analytics/route";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/analytics", () => {
  it("returns 401 when not authenticated", async () => {
    (verifySessionFromRequest as any).mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/analytics"));
    expect(res.status).toBe(401);
  });

  it("returns 400 for unknown analytics type", async () => {
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
    const res = await GET(new Request("http://localhost/api/analytics?type=unknown_type"));
    expect(res.status).toBe(400);
  });
});
