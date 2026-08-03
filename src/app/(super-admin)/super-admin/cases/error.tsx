"use client";
import { PageError } from "@/components/page-error";
export default function CasesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Cases Error" error={error} reset={reset} />;
}
