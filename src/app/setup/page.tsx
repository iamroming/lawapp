"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AdminSetupPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login after 5 seconds
    const timer = setTimeout(() => router.push("/login"), 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Shield className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-3" />
          <CardTitle className="text-2xl text-[var(--text-primary)]">Setup Unavailable</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-[var(--text-secondary)]">
            This page is no longer available. Use the normal signup flow instead.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 text-[var(--text-accent)] hover:underline font-medium"
          >
            Go to Signup <ArrowRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
