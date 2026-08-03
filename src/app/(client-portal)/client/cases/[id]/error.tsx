"use client";
import { PageError } from "@/components/page-error";
export default function CaseDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Case Detail Error" error={error} reset={reset} />;
}
