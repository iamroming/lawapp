import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/firebase/auth", () => ({
  verifySessionFromRequest: vi.fn(),
}));

vi.mock("@/lib/firebase/admin", () => ({
  getAdminAuth: vi.fn(),
}));

import { DELETE } from "@/app/api/account/delete/route";
import { createClient } from "@/lib/supabase/server";
import { verifySessionFromRequest } from "@/lib/firebase/auth";
import { getAdminAuth } from "@/lib/firebase/admin";

const mockUser = { id: "user-1", email: "lawyer@test.com" };
let mockChain: any;

beforeEach(() => {
  vi.clearAllMocks();
  mockChain = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  };
  (createClient as any).mockResolvedValue({
    from: vi.fn().mockReturnValue(mockChain),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  });
  (getAdminAuth as any).mockResolvedValue({
    revokeRefreshTokens: vi.fn().mockResolvedValue(undefined),
    deleteUser: vi.fn().mockResolvedValue(undefined),
  });
});

function makeRequest(body: any) {
  return new Request("http://localhost/api/account/delete", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("DELETE /api/account/delete", () => {
  it("returns 401 when not authenticated", async () => {
    (verifySessionFromRequest as any).mockResolvedValue(null);
    const res = await DELETE(makeRequest({ confirm_email: "lawyer@test.com" }));
    expect(res.status).toBe(401);
  });

  it("rejects mismatched email confirmation", async () => {
    (verifySessionFromRequest as any).mockResolvedValue({
      uid: "user-1",
      uuid: "user-1",
      email: "lawyer@test.com",
      displayName: "Test User",
    });
    const res = await DELETE(makeRequest({ confirm_email: "wrong@email.com" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("does not match");
  });

  it("soft-deletes account with correct email", async () => {
    (verifySessionFromRequest as any).mockResolvedValue({
      uid: "user-1",
      uuid: "user-1",
      email: "lawyer@test.com",
      displayName: "Test User",
    });
    const res = await DELETE(makeRequest({ confirm_email: "lawyer@test.com" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain("DPDP");
  });
});
