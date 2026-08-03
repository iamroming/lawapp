"use client";
import { PageError } from "@/components/page-error";
export default function StampDutyError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Stamp Duty Error" error={error} reset={reset} />;
}
