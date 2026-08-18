import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn().mockReturnValue({
    auth: {
      admin: {
        createUser: vi.fn(),
      },
    },
    from: vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }),
  }),
}));

vi.mock("@/lib/firebase/admin", () => ({
  getAdminAuth: vi.fn(),
}));

import { POST } from "@/app/api/auth/signup/route";
import { createClient } from "@supabase/supabase-js";
import { getAdminAuth } from "@/lib/firebase/admin";

function makeRequest(body: any) {
  return new Request("http://localhost:3000/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getAdminAuth as any).mockResolvedValue({
      createUser: vi.fn().mockResolvedValue({
        data: { user: { id: "new-user-id" } },
        error: null,
      }),
    });
  });

  it("returns 400 for missing fields", async () => {
    const response = await POST(makeRequest({ email: "test@test.com" }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it("returns 400 for short password", async () => {
    const response = await POST(makeRequest({
      email: "test@test.com",
      password: "123",
      full_name: "Test",
    }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when Supabase returns error", async () => {
    const mockAdminAuth = await getAdminAuth() as any;
    mockAdminAuth.createUser.mockRejectedValue({
      code: "auth/email-already-exists",
      message: "The email address is already in use by another account.",
    });

    const response = await POST(makeRequest({
      email: "existing@test.com",
      password: "StrongPass1",
      full_name: "Test User",
      signup_mode: "owner",
    }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("already exists");
  });

  it("creates owner account successfully", async () => {
    const mockAdminAuth = await getAdminAuth() as any;
    mockAdminAuth.createUser.mockResolvedValue({
      uid: "new-user-id",
    });

    const response = await POST(makeRequest({
      email: "new@lawyer.com",
      password: "StrongPass1",
      full_name: "Advocate Kumar",
      phone: "9876543210",
      firm_name: "Kumar & Associates",
      signup_mode: "owner",
    }));

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
