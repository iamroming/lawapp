"use client";
import { PageError } from "@/components/page-error";
export default function BareActsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Bare Acts Error" error={error} reset={reset} />;
}
