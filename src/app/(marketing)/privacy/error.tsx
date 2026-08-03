"use client";
import { PageError } from "@/components/page-error";
export default function PrivacyError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Privacy Error" error={error} reset={reset} />;
}
