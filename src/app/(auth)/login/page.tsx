"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebase/config";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scale, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const auth = getFirebaseAuth();
  const router = useRouter();
  const loginInProgress = useRef(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || loginInProgress.current) return;

    let cancelled = false;
    (async () => {
      try {
        const idToken = await user.getIdToken();
        const profileRes = await fetch("/api/auth/profile", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (cancelled || !profileRes.ok) return;
        const { is_super_admin } = await profileRes.json();
        if (cancelled) return;
        router.replace(is_super_admin ? "/super-admin" : "/dashboard");
      } catch {
        // user stays on login page
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const handlePostLogin = async (user: { uid: string; getIdToken: () => Promise<string> }) => {
    loginInProgress.current = true;
    const idToken = await user.getIdToken(true);
    const sessionRes = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    const sessionData = await sessionRes.json();

    if (!sessionRes.ok) {
      console.error("Session creation failed:", sessionRes.status, sessionData);
      toast.error(sessionData.error || `Failed to create session (HTTP ${sessionRes.status}). Please try again.`);
      return false;
    }

    const profileRes = await fetch("/api/auth/profile", {
      headers: { Authorization: `Bearer ${idToken}` },
    });

    if (!profileRes.ok) {
      router.push("/onboarding");
      return true;
    }

    const { profile, is_super_admin } = await profileRes.json();

    if (is_super_admin) {
      router.push("/super-admin");
    } else if (!profile) {
      router.push("/onboarding");
    } else {
      router.push("/dashboard");
    }
    return true;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      await handlePostLogin(user);
    } catch {
      toast.error("Invalid email or password");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
      await handlePostLogin(user);
    } catch (error: any) {
      console.error("Google login error:", error);
      if (error?.code === "auth/popup-closed-by-user") {
        toast.error("Sign-in cancelled");
      } else if (error?.code === "auth/account-exists-with-different-credential") {
        toast.error("An account already exists with this email. Please sign in with email.");
      } else {
        toast.error("Google sign-in failed. Please try again.");
      }
    }
    setGoogleLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please enter your email");
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success("Password reset email sent! Check your inbox.");
      setShowForgot(false);
      setResetEmail("");
    } catch {
      toast.error("An unexpected error occurred");
    }
    setResetLoading(false);
  };

  if (showForgot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <Scale className="h-8 w-8 text-[var(--accent)]" />
              <span className="text-xl font-bold text-[var(--text-primary)]">CaseFiles</span>
            </Link>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reset Password</h1>
            <p className="mt-2 text-[var(--text-secondary)]">Enter your email to receive a reset link</p>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8">
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-10 bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--text-primary)]"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
                disabled={resetLoading}
              >
                {resetLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowForgot(false)}
                className="text-sm text-[var(--text-accent)] hover:underline font-medium"
              >
                Back to sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[var(--background)]">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/10 via-[var(--background)] to-[var(--background)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--accent)/5,_transparent_70%)]" />
        <div className="relative z-10 max-w-md px-8 text-center">
          <Scale className="h-16 w-16 text-[var(--accent)] mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
            Welcome back to CaseFiles
          </h2>
          <p className="text-[var(--text-secondary)] text-lg">
            Manage your cases, clients, and court dates — all in one place.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <div className="text-2xl font-bold text-[var(--accent)]">2,500+</div>
              <div className="text-xs text-[var(--text-tertiary)] mt-1">Lawyers</div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <div className="text-2xl font-bold text-[var(--accent)]">15K+</div>
              <div className="text-xs text-[var(--text-tertiary)] mt-1">Cases</div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <div className="text-2xl font-bold text-[var(--accent)]">99.9%</div>
              <div className="text-xs text-[var(--text-tertiary)] mt-1">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <Scale className="h-8 w-8 text-[var(--accent)]" />
              <span className="text-xl font-bold text-[var(--text-primary)]">CaseFiles</span>
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Sign in to your account</h1>
            <p className="mt-2 text-[var(--text-secondary)]">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-[var(--accent)] hover:text-[var(--accent-hover)] underline font-semibold">
                Sign up for free →
              </Link>
            </p>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Password</label>
                  <button
                    type="button"
                    onClick={() => { setShowForgot(true); setResetEmail(email); }}
                    className="text-xs text-[var(--text-accent)] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold"
                disabled={loading}
              >
                {loading ? (
                  "Signing in..."
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[var(--border)]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[var(--surface)] px-2 text-[var(--text-tertiary)]">or</span>
              </div>
            </div>

            <Button
              onClick={handleGoogleLogin}
              className="w-full bg-[var(--surface-subtle)] hover:bg-[var(--surface-warm)] border border-[var(--border)] text-[var(--text-primary)] font-medium"
              variant="outline"
              disabled={googleLoading}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {googleLoading ? "Signing in..." : "Continue with Google"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
