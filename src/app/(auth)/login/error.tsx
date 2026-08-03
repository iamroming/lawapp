"use client";
import { PageError } from "@/components/page-error";
export default function LoginError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Login Error" error={error} reset={reset} />;
}
