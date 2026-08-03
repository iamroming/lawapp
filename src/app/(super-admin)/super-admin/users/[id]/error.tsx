"use client";
import { PageError } from "@/components/page-error";
export default function UserDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="User Detail Error" error={error} reset={reset} />;
}
