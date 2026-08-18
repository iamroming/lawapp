import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { checkCaseLimit, checkUserLimit, checkStorageLimit } from "@/lib/subscription-limits";
import { createClient } from "@/lib/supabase/server";

const mockChain: any = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  (createClient as any).mockResolvedValue({
    from: vi.fn().mockReturnValue(mockChain),
  });
});

describe("checkCaseLimit", () => {
  it("allows cases when no subscription (free plan, 3 cases)", async () => {
    mockChain.single.mockResolvedValue({ data: null, error: null });
    const result = await checkCaseLimit("user-1", 2);
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(3);
    expect(result.plan).toBe("Free");
  });

  it("blocks cases when limit reached", async () => {
    mockChain.single.mockResolvedValue({ data: null, error: null });
    const result = await checkCaseLimit("user-1", 3);
    expect(result.allowed).toBe(false);
    expect(result.limit).toBe(3);
  });

  it("allows unlimited cases with -1 limit", async () => {
    mockChain.single.mockResolvedValue({
      data: {
        plan: { name: "Enterprise", max_cases: -1, max_users: -1, max_storage_mb: -1 },
      },
      error: null,
    });
    const result = await checkCaseLimit("user-1", 1000);
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(-1);
  });
});

describe("checkUserLimit", () => {
  it("allows users when under limit", async () => {
    mockChain.single.mockResolvedValue({ data: null, error: null });
    const result = await checkUserLimit("user-1", 0);
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(1);
  });

  it("blocks users when limit reached", async () => {
    mockChain.single.mockResolvedValue({ data: null, error: null });
    const result = await checkUserLimit("user-1", 1);
    expect(result.allowed).toBe(false);
  });
});

describe("checkStorageLimit", () => {
  it("allows storage when under limit", async () => {
    mockChain.single.mockResolvedValue({ data: null, error: null });
    const result = await checkStorageLimit("user-1", 49 * 1024 * 1024);
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(200);
  });

  it("blocks storage when over limit", async () => {
    mockChain.single.mockResolvedValue({ data: null, error: null });
    const result = await checkStorageLimit("user-1", 200 * 1024 * 1024);
    expect(result.allowed).toBe(false);
  });
});
