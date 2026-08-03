"use client";
import { PageError } from "@/components/page-error";
export default function LimitationCalculatorError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Limitation Calculator Error" error={error} reset={reset} />;
}
