"use client";
import { PageError } from "@/components/page-error";
export default function PricingError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Pricing Error" error={error} reset={reset} />;
}
