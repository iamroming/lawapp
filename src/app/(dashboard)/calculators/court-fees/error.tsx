"use client";
import { PageError } from "@/components/page-error";
export default function CourtFeesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Court Fees Error" error={error} reset={reset} />;
}
