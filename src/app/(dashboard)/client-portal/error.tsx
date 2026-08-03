"use client";
import { PageError } from "@/components/page-error";
export default function ClientPortalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Client Portal Error" error={error} reset={reset} />;
}
