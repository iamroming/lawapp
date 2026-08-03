"use client";
import { PageError } from "@/components/page-error";
export default function SubscriptionsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Subscriptions Error" error={error} reset={reset} />;
}
