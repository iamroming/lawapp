"use client";
import { PageError } from "@/components/page-error";
export default function ECourtsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="eCourts Error" error={error} reset={reset} />;
}
