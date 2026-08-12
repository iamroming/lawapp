"use client";
import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ConfirmEmailPage() {
  return (
    <Suspense>
      <ConfirmEmailContent />
    </Suspense>
  );
}

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-accent)]">
            <Mail className="h-6 w-6 text-[var(--text-accent)]" />
          </div>
          <CardTitle className="text-2xl">Check Your Email</CardTitle>
          <CardDescription>
            We&apos;ve sent a verification link to
            {emailParam && <span className="font-medium text-[var(--text-primary)]"> {emailParam}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-[var(--text-accent)] mt-0.5 shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Click the link in your email to verify your account.</p>
                <p className="mt-1">You can then sign in to your dashboard.</p>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-[var(--text-secondary)] space-y-1">
            <p>
              Already verified?{" "}
              <Link href="/login" className="text-[var(--text-accent)] hover:underline font-medium">
                Sign in
              </Link>
            </p>
            <p>
              Wrong email?{" "}
              <Link href="/signup" className="text-[var(--text-accent)] hover:underline font-medium">
                Sign up again
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
