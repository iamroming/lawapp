"use client";
import { PageError } from "@/components/page-error";
export default function RevenueError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Revenue Error" error={error} reset={reset} />;
}
