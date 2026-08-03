"use client";
import { PageError } from "@/components/page-error";
export default function FeaturesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Features Error" error={error} reset={reset} />;
}
