const COURT_SERVICE_URL = process.env.COURT_SERVICE_URL || "";

export async function courtServiceFetch(path: string, options?: RequestInit) {
  // On Vercel, call Python serverless functions directly
  // Locally, call the FastAPI service
  const url = COURT_SERVICE_URL
    ? `${COURT_SERVICE_URL}${path}`
    : `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Court service error (${res.status}): ${error}`);
  }

  return res.json();
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
