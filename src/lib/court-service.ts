const COURT_SERVICE_URL = process.env.COURT_SERVICE_URL || "";

function isSameDomain(url: string, baseUrl: string): boolean {
  try {
    const parsed = new URL(url);
    const base = new URL(baseUrl);
    return parsed.hostname === base.hostname && parsed.protocol === base.protocol;
  } catch {
    return false;
  }
}

export async function courtServiceFetch(path: string, options?: RequestInit) {
  if (!COURT_SERVICE_URL) {
    return [];
  }

  const url = `${COURT_SERVICE_URL}${path}`;

  if (!isSameDomain(url, COURT_SERVICE_URL)) {
    console.error("courtServiceFetch: URL validation failed for", url);
    return [];
  }

  try {
    const res = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(15000),
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      return [];
    }

    return res.json();
  } catch {
    return [];
  }
}

export function buildQueryString(params: Record<string, string | boolean | number | undefined | null>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  return searchParams.toString();
}
