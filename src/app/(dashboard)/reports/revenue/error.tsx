"use client";
import { PageError } from "@/components/page-error";
export default function RevenueReportError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Revenue Report Error" error={error} reset={reset} />;
}
