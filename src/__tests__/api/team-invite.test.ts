import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/firebase/auth", () => ({
  verifySessionFromRequest: vi.fn(),
}));

import { POST } from "@/app/api/team/invite/route";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";

const mockUser = { id: "owner-1", email: "owner@firm.com" };
const mockOwnerProfile = { id: "owner-1", role: "owner", firm_id: "firm-1" };

let mockChain: any;

beforeEach(() => {
  vi.clearAllMocks();

  mockChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    then: vi.fn(),
  };

  (createClient as any).mockResolvedValue({
    from: vi.fn().mockReturnValue(mockChain),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  });
});

function makeRequest(body: any) {
  return new Request("http://localhost:3000/api/team/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/team/invite", () => {
  it("returns 401 when not authenticated", async () => {
    (verifySessionFromRequest as any).mockResolvedValue(null);

    const response = await POST(makeRequest({ email: "new@team.com", role: "associate" }));
    expect(response.status).toBe(401);
  });

  it("returns 403 when non-owner tries to invite", async () => {
    (verifySessionFromRequest as any).mockResolvedValue({
      uid: "owner-1",
      uuid: "owner-1",
      email: "owner@firm.com",
      displayName: "Test Owner",
    });

    mockChain.single.mockResolvedValue({
      data: { id: "owner-1", role: "associate", firm_id: "firm-1" },
      error: null,
    });

    const response = await POST(makeRequest({ email: "new@team.com", role: "associate" }));
    expect(response.status).toBe(403);
  });

  it("returns 400 for invalid role", async () => {
    (verifySessionFromRequest as any).mockResolvedValue({
      uid: "owner-1",
      uuid: "owner-1",
      email: "owner@firm.com",
      displayName: "Test Owner",
    });

    mockChain.single.mockResolvedValue({ data: mockOwnerProfile, error: null });

    const response = await POST(makeRequest({ email: "new@team.com", role: "super_hero" }));
    expect(response.status).toBe(400);
  });
});
