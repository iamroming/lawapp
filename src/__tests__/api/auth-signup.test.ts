import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the admin client used by signup route
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

import { POST } from "@/app/api/auth/signup/route";
import { createClient } from "@supabase/supabase-js";

function makeRequest(body: any) {
  return new Request("http://localhost:3000/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/signup", () => {
  it("returns 400 for missing fields", async () => {
    const response = await POST(makeRequest({ email: "test@test.com" }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Missing");
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
    const mockClient = (createClient as any)();
    mockClient.auth.admin.createUser.mockResolvedValue({
      data: null,
      error: { message: "User already exists" },
    });

    const response = await POST(makeRequest({
      email: "existing@test.com",
      password: "StrongPass1",
      full_name: "Test User",
    }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("User already exists");
  });

  it("creates owner account successfully", async () => {
    const mockClient = (createClient as any)();
    mockClient.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: "new-user-id" } },
      error: null,
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
    expect(data.user_id).toBe("new-user-id");
  });
});
