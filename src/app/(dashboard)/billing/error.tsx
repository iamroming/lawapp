"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function BillingError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-500 text-sm mb-6">Failed to load billing information.</p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={reset}>Try Again</Button>
          <Link href="/dashboard"><Button variant="outline">Go to Dashboard</Button></Link>
        </div>
      </div>
    </div>
  );
}
