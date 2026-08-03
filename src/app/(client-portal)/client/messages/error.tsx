"use client";
import { PageError } from "@/components/page-error";
export default function MessagesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Messages Error" error={error} reset={reset} />;
}
