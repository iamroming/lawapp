"use client";
import { PageError } from "@/components/page-error";
export default function NotificationPreferencesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError title="Notification Preferences Error" error={error} reset={reset} />;
}
