"use client";
import { PageError } from "@/components/page-error";
export default function ReportsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Reports Error" error={error} reset={reset} />;
}
