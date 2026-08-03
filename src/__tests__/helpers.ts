import { vi } from "vitest";

export interface MockSupabaseClient {
  auth: {
    getUser: ReturnType<typeof vi.fn>;
    getSession: ReturnType<typeof vi.fn>;
    signInWithPassword: ReturnType<typeof vi.fn>;
    signUp: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
    resend: ReturnType<typeof vi.fn>;
    admin: {
      createUser: ReturnType<typeof vi.fn>;
      listUsers: ReturnType<typeof vi.fn>;
      updateUserById: ReturnType<typeof vi.fn>;
    };
  };
  from: ReturnType<typeof vi.fn>;
  rpc: ReturnType<typeof vi.fn>;
  storage: {
    from: ReturnType<typeof vi.fn>;
  };
}

export function createMockSupabaseClient(): MockSupabaseClient {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resend: vi.fn().mockResolvedValue({ error: null }),
      admin: {
        createUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user-id" } }, error: null }),
        listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
        updateUserById: vi.fn().mockResolvedValue({ error: null }),
      },
    },
    from: vi.fn().mockReturnValue(chainable),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: "test/path" }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://test.com/file.pdf" } }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
  };
}

export function mockAuthUser(client: MockSupabaseClient, userId: string = "test-user-id", email: string = "test@example.com") {
  client.auth.getUser.mockResolvedValue({
    data: {
      user: {
        id: userId,
        email,
        user_metadata: { full_name: "Test User" },
      },
    },
    error: null,
  });
}

export function mockProfile(client: MockSupabaseClient, overrides: Record<string, any> = {}) {
  const defaultProfile = {
    id: "test-user-id",
    email: "test@example.com",
    full_name: "Test User",
    role: "owner",
    firm_id: "test-firm-id",
    firm_name: "Test Firm",
    is_active: true,
    ...overrides,
  };

  const chain = client.from();
  chain.single.mockResolvedValue({ data: defaultProfile, error: null });
  return defaultProfile;
}

export function createMockRequest(options: {
  method?: string;
  url?: string;
  body?: any;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
} = {}): Request {
  const { method = "GET", url = "http://localhost:3000/api/test", body, headers = {}, cookies = {} } = options;

  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

  return new Request(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  } as any);
}
