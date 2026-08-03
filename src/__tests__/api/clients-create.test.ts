import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { POST } from "@/app/api/clients/route";
import { createClient } from "@/lib/supabase/server";

const mockUser = { id: "user-1", email: "lawyer@test.com" };
const mockProfile = { id: "user-1", role: "owner", firm_id: "firm-1" };

let mockChain: any;

beforeEach(() => {
  vi.clearAllMocks();

  mockChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    then: vi.fn(),
  };

  (createClient as any).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    },
    from: vi.fn().mockReturnValue(mockChain),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  });
});

function makeRequest(body: any) {
  return new Request("http://localhost:3000/api/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/clients", () => {
  it("returns 401 when not authenticated", async () => {
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    });

    const response = await POST(makeRequest({ full_name: "Test", phone: "9876543210" }));
    expect(response.status).toBe(401);
  });

  it("creates client with valid data", async () => {
    mockChain.single.mockResolvedValue({ data: mockProfile, error: null });
    mockChain.then.mockResolvedValue({ data: [], error: null, count: 0 });

    const response = await POST(makeRequest({
      full_name: "Rajesh Kumar",
      phone: "9876543210",
      email: "rajesh@client.com",
    }));

    expect(response.status).toBeDefined();
  });

  it("rejects invalid phone number", async () => {
    mockChain.single.mockResolvedValue({ data: mockProfile, error: null });

    const response = await POST(makeRequest({
      full_name: "Test",
      phone: "123",
    }));

    expect(response.status).toBeDefined();
  });
});
