"use client";
import { PageError } from "@/components/page-error";
export default function NewClientError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="New Client Error" error={error} reset={reset} />;
}
