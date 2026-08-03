import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { GET } from "@/app/api/analytics/route";
import { createClient } from "@/lib/supabase/server";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/analytics", () => {
  it("returns 401 when not authenticated", async () => {
    (createClient as any).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    });
    const res = await GET(new Request("http://localhost/api/analytics"));
    expect(res.status).toBe(401);
  });

  it("returns 400 for unknown analytics type", async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "user-1", role: "owner", firm_id: "firm-1" }, error: null }),
    };
    (createClient as any).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }) },
      from: vi.fn().mockReturnValue(mockChain),
    });
    const res = await GET(new Request("http://localhost/api/analytics?type=unknown_type"));
    expect(res.status).toBe(400);
  });
});
