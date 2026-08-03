"use client";
import { PageError } from "@/components/page-error";
export default function GstCalculatorError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="GST Calculator Error" error={error} reset={reset} />;
}
