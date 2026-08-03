"use client";
import { PageError } from "@/components/page-error";
export default function ActivityError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Activity Error" error={error} reset={reset} />;
}
