"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Scale, AlertTriangle } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ClientLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Check if user is a client
    const { data: portalUser } = await supabase
      .from("client_portal_users")
      .select("*")
      .eq("user_id", data.user.id)
      .eq("is_active", true)
      .single();

    if (!portalUser) {
      setError("Access denied. This portal is for clients only.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    toast.success("Welcome to Client Portal!");
    router.push("/client/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Scale className="h-10 w-10 text-[var(--text-accent)]" />
            <span className="font-bold text-2xl">LawXP</span>
          </div>
          <h2 className="text-3xl font-bold text-[var(--text-primary)]">Client Portal</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Access your cases, documents, and payments
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access the portal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            <Link href="/login" className="text-[var(--text-accent)] hover:underline">
              Lawyer Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
