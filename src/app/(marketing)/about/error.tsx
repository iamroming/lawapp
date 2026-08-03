"use client";
import { PageError } from "@/components/page-error";
export default function AboutError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="About Error" error={error} reset={reset} />;
}
