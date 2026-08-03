"use client";
import { PageError } from "@/components/page-error";
export default function RemindersError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Reminders Error" error={error} reset={reset} />;
}
