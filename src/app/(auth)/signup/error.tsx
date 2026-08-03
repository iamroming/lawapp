"use client";
import { PageError } from "@/components/page-error";
export default function SignupError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Signup Error" error={error} reset={reset} />;
}
