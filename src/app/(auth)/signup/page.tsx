"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebase/config";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scale, Mail, Lock, User, Phone, Building, Briefcase, Users, CheckCircle, KeyRound, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

type SignupMode = null | "owner" | "employee";

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mode, setMode] = useState<SignupMode>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteValid, setInviteValid] = useState<boolean | null>(null);
  const [inviteRole, setInviteRole] = useState("");
  const [validatingCode, setValidatingCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const signupInProgress = useRef(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    firm_name: "",
  });
  const auth = getFirebaseAuth();
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || signupInProgress.current) return;

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
        // user stays on signup page
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const validateInviteCode = async (code: string) => {
    if (!code.trim()) {
      setInviteValid(null);
      setInviteRole("");
      return;
    }
    setValidatingCode(true);
    try {
      const res = await fetch(`/api/team/redeem-code?code=${encodeURIComponent(code.trim())}`);
      const data = await res.json();
      setInviteValid(data.valid);
      setInviteRole(data.role_id || "");
    } catch {
      setInviteValid(false);
      setInviteRole("");
    } finally {
      setValidatingCode(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.full_name) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(formData.password)) {
      toast.error("Password must contain at least one uppercase letter");
      return;
    }
    if (!/[0-9]/.test(formData.password)) {
      toast.error("Password must contain at least one number");
      return;
    }
    if (mode === "employee" && !inviteValid) {
      toast.error("Please enter a valid invite code");
      return;
    }
    if (!acceptTerms) {
      toast.error("Please accept the Terms & Conditions and Privacy Policy");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
          firm_name: formData.firm_name,
          signup_mode: mode,
          ...(mode === "employee" && { invite_code: inviteCode }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create account");
        setLoading(false);
        return;
      }

      toast.success("Account created! Please check your email to verify.");
      setLoading(false);
      router.push(`/confirm-email?email=${encodeURIComponent(formData.email)}`);
    } catch {
      toast.error("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    signupInProgress.current = true;
    setGoogleLoading(true);
    try {
      const { user } = await signInWithPopup(auth, new GoogleAuthProvider());

      const idToken = await user.getIdToken(true);
      const sessionRes = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const sessionData = await sessionRes.json();

      if (!sessionRes.ok) {
        console.error("Session creation failed:", sessionData);
        toast.error(sessionData.error || "Failed to create session. Please try again.");
        setGoogleLoading(false);
        return;
      }

      const profileRes = await fetch("/api/auth/profile", {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      setGoogleLoading(false);

      if (!profileRes.ok) {
        router.push("/onboarding");
        return;
      }

      const { profile, is_super_admin } = await profileRes.json();

      if (is_super_admin) {
        router.push("/super-admin");
      } else if (!profile) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Google signup error:", error);
      if (error?.code === "auth/popup-closed-by-user") {
        toast.error("Sign-up cancelled");
      } else if (error?.code === "auth/account-exists-with-different-credential") {
        toast.error("An account already exists with this email. Please sign in instead.");
      } else {
        toast.error("Google sign-up failed. Please try again.");
      }
      setGoogleLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const roleDisplayNames: Record<string, string> = {
    partner: "Partner",
    senior_associate: "Senior Associate",
    associate: "Associate",
    junior_associate: "Junior Associate",
    paralegal: "Paralegal",
    intern: "Intern",
    office_admin: "Office Admin",
  };

  if (!mode) {
    return (
      <div className="min-h-screen flex bg-[var(--background)]">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/10 via-[var(--background)] to-[var(--background)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--accent)/5,_transparent_70%)]" />
          <div className="relative z-10 max-w-md px-8 text-center">
            <Scale className="h-16 w-16 text-[var(--accent)] mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
              Start Your Free Trial
            </h2>
            <p className="text-[var(--text-secondary)] text-lg">
              Join 2,500+ lawyers who manage their practice with CaseFiles.
            </p>
            <div className="mt-8 space-y-4 text-left">
              {[
                "Unlimited case management",
                "AI-powered legal research",
                "GST invoicing & payments",
                "Client portal & notifications",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-[var(--accent)] shrink-0" />
                  <span className="text-[var(--text-secondary)]">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="inline-flex items-center gap-2">
                <Scale className="h-8 w-8 text-[var(--accent)]" />
                <span className="text-xl font-bold text-[var(--text-primary)]">CaseFiles</span>
              </Link>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Create your account</h1>
              <p className="mt-2 text-[var(--text-secondary)]">
                Already have an account?{" "}
                <Link href="/login" className="text-[var(--accent)] hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8">
              <div className="space-y-4">
                <button
                  onClick={() => setMode("owner")}
                  className="w-full p-5 border-2 border-[var(--border)] rounded-xl text-left hover:border-[var(--accent)] hover:bg-[var(--surface-subtle)] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--surface-subtle)] group-hover:bg-[var(--accent)]/10 transition-colors">
                      <Briefcase className="h-6 w-6 text-[var(--accent)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-[var(--text-primary)]">I&apos;m a Firm Owner</h3>
                      <p className="text-sm text-[var(--text-secondary)]">Create my own firm, invite team members</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setMode("employee")}
                  className="w-full p-5 border-2 border-[var(--border)] rounded-xl text-left hover:border-green-500 hover:bg-green-500/5 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--surface-subtle)] group-hover:bg-green-500/10 transition-colors">
                      <Users className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-[var(--text-primary)]">I&apos;m a Team Member</h3>
                      <p className="text-sm text-[var(--text-secondary)]">Join an existing firm using an invite code</p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[var(--border)]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[var(--surface)] px-2 text-[var(--text-tertiary)]">or</span>
                </div>
              </div>

              <Button
                onClick={handleGoogleSignup}
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
                {googleLoading ? "Signing up..." : "Continue with Google"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[var(--background)]">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/10 via-[var(--background)] to-[var(--background)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--accent)/5,_transparent_70%)]" />
        <div className="relative z-10 max-w-md px-8 text-center">
          <Scale className="h-16 w-16 text-[var(--accent)] mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
            {mode === "owner" ? "Set Up Your Firm" : "Join Your Team"}
          </h2>
          <p className="text-[var(--text-secondary)] text-lg">
            {mode === "owner"
              ? "Create your firm and start inviting team members in minutes."
              : "Enter the invite code from your firm owner to get started."}
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <Scale className="h-8 w-8 text-[var(--accent)]" />
              <span className="text-xl font-bold text-[var(--text-primary)]">CaseFiles</span>
            </Link>
          </div>

          <div className="text-center mb-8">
            <button
              onClick={() => setMode(null)}
              className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] mb-4 inline-flex items-center gap-1"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {mode === "owner" ? "Create Your Firm" : "Join Your Team"}
            </h1>
            <p className="mt-2 text-[var(--text-secondary)]">
              {mode === "owner"
                ? "Set up your firm and start inviting team members"
                : "Enter the invite code from your firm owner"}
            </p>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8">
            {mode === "employee" && (
              <div className={`p-4 rounded-xl border-2 mb-6 ${
                inviteValid === true ? "border-green-500 bg-green-500/5" :
                inviteValid === false ? "border-red-500 bg-red-500/5" :
                "border-[var(--border)]"
              }`}>
                <label className="text-sm font-medium flex items-center gap-2 mb-2 text-[var(--text-primary)]">
                  <KeyRound className="h-4 w-4" />
                  Invite Code
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. A3B7K9PX"
                    value={inviteCode}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setInviteCode(val);
                      if (debounceRef.current) clearTimeout(debounceRef.current);
                      debounceRef.current = setTimeout(() => validateInviteCode(val), 300);
                    }}
                    className="font-mono text-lg tracking-wider bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--text-primary)]"
                    maxLength={8}
                  />
                </div>
                {validatingCode && (
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">Validating...</p>
                )}
                {inviteValid === true && (
                  <p className="text-sm text-green-500 mt-1 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Valid code — Role: {roleDisplayNames[inviteRole] || inviteRole}
                  </p>
                )}
                {inviteValid === false && inviteCode.length >= 4 && (
                  <p className="text-sm text-red-500 mt-1">
                    Invalid or already used code
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                  <Input
                    placeholder="Advocate Rahul Sharma"
                    value={formData.full_name}
                    onChange={(e) => updateField("full_name", e.target.value)}
                    className="pl-10 bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="pl-10 bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    className="pl-10 pr-10 bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                    required
                    minLength={8}
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                  <Input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="pl-10 bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                  />
                </div>
              </div>

              {mode === "owner" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Firm / Chamber Name</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                    <Input
                      placeholder="Sharma & Associates"
                      value={formData.firm_name}
                      onChange={(e) => updateField("firm_name", e.target.value)}
                      className="pl-10 bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)]">
                <input
                  type="checkbox"
                  id="accept-terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-[var(--border)] accent-[var(--accent)]"
                />
                <label htmlFor="accept-terms" className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" target="_blank" className="text-[var(--accent)] hover:underline font-medium">
                    Terms &amp; Conditions
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" target="_blank" className="text-[var(--accent)] hover:underline font-medium">
                    Privacy Policy
                  </Link>{" "}
                  of CaseFiles. I understand that my data will be processed in accordance with these policies.
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold"
                disabled={loading || (mode === "employee" && !inviteValid)}
              >
                {loading ? (
                  "Creating Account..."
                ) : (
                  <>
                    {mode === "owner" ? "Create Firm & Account" : "Join Team"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
