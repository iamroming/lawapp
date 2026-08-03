"use client";
import { PageError } from "@/components/page-error";
export default function NewCaseError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="New Case Error" error={error} reset={reset} />;
}
