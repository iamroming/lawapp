"use client";
import { PageError } from "@/components/page-error";
export default function AiCaseAnalysisError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="AI Analysis Error" error={error} reset={reset} />;
}
