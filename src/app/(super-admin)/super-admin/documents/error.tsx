"use client";
import { PageError } from "@/components/page-error";
export default function DocumentsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Documents Error" error={error} reset={reset} />;
}
