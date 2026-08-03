"use client";
import { PageError } from "@/components/page-error";
export default function AiResearchError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="AI Research Error" error={error} reset={reset} />;
}
