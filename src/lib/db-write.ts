import { getFirebaseAuth } from "@/lib/firebase/config";

export async function dbWrite(
  table: string,
  operation: "insert" | "update" | "upsert" | "delete",
  data?: any,
  match?: any
): Promise<{ data?: any; error?: string }> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) {
    return { error: "Not authenticated" };
  }

  const idToken = await user.getIdToken();

  const res = await fetch("/api/db/write", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ table, operation, data, match }),
  });

  const result = await res.json();

  if (!res.ok) {
    return { error: result.error || "Database operation failed" };
  }

  return { data: result.data };
}
