"use client";
import { PageError } from "@/components/page-error";
export default function ContactError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Contact Error" error={error} reset={reset} />;
}
