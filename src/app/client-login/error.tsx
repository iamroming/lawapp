"use client";
import { PageError } from "@/components/page-error";
export default function ClientLoginError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Client Login Error" error={error} reset={reset} />;
}
