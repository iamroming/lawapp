"use client";
import { PageError } from "@/components/page-error";
export default function ClientsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Clients Error" error={error} reset={reset} />;
}
