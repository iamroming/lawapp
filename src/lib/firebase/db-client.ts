import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let client: ReturnType<typeof createClient> | null = null;

/**
 * Supabase client for DATABASE OPERATIONS ONLY.
 * Auth is handled by Firebase. This client is only for querying Supabase Postgres.
 */
export function createDatabaseClient() {
  if (client) return client;

  if (!supabaseUrl || !supabaseKey) {
    return new Proxy({} as ReturnType<typeof createClient>, {
      get(_target, prop) {
        if (prop === "then") return undefined;
        return () => Promise.resolve({ data: null, error: null });
      },
    }) as ReturnType<typeof createClient>;
  }

  client = createClient(supabaseUrl, supabaseKey);
  return client;
}
