import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { GET, POST } from "@/app/api/tags/route";
import { createClient } from "@/lib/supabase/server";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/tags", () => {
  it("returns 401 when not authenticated", async () => {
    (createClient as any).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    });
    const res = await GET(new Request("http://localhost/api/tags"));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/tags", () => {
  it("returns 401 when not authenticated", async () => {
    (createClient as any).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    });
    const req = new Request("http://localhost/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
