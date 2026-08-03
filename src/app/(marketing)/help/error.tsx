"use client";
import { PageError } from "@/components/page-error";
export default function HelpError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Help Error" error={error} reset={reset} />;
}
