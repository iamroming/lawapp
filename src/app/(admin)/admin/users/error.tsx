"use client";
import { PageError } from "@/components/page-error";
export default function UsersError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Users Error" error={error} reset={reset} />;
}
