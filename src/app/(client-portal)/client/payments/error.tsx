"use client";
import { PageError } from "@/components/page-error";
export default function PaymentsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Payments Error" error={error} reset={reset} />;
}
