import { createClient } from "@supabase/supabase-js";

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  reset_time: string;
}

// Fallback to in-memory for local dev when Supabase is unavailable
const memoryStore = new Map<string, { count: number; resetTime: number }>();

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 5 }
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const now = Date.now();

  // Try Supabase first
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const windowStart = new Date(now - config.windowMs).toISOString();

      // Delete old entries for this key
      await supabase
        .from("rate_limits")
        .delete()
        .eq("key", key)
        .lt("created_at", windowStart);

      // Count current requests in window
      const { count, error: countError } = await supabase
        .from("rate_limits")
        .select("*", { count: "exact", head: true })
        .eq("key", key)
        .gte("created_at", windowStart);

      if (countError) throw countError;

      const currentCount = count || 0;

      if (currentCount >= config.maxRequests) {
        const resetIn = Math.ceil(config.windowMs / 1000);
        return { allowed: false, remaining: 0, resetIn };
      }

      // Insert new entry
      await supabase.from("rate_limits").insert({
        key,
        created_at: new Date().toISOString(),
      });

      return {
        allowed: true,
        remaining: config.maxRequests - currentCount - 1,
        resetIn: Math.ceil(config.windowMs / 1000),
      };
    } catch {
      // Fall through to in-memory store
    }
  }

  // In-memory fallback (development only)
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetTime) {
    memoryStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: Math.ceil(config.windowMs / 1000) };
  }

  if (entry.count >= config.maxRequests) {
    const resetIn = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, resetIn };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: Math.ceil((entry.resetTime - now) / 1000),
  };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
