"use client";
import { PageError } from "@/components/page-error";
export default function CaseReportError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Case Report Error" error={error} reset={reset} />;
}
