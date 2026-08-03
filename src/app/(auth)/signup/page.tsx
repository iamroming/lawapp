"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, Mail, Lock, User, Phone, Building, Briefcase, Users, CheckCircle, KeyRound } from "lucide-react";
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
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    firm_name: "",
  });
  const supabase = createClient();
  const router = useRouter();

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
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create account");
        setLoading(false);
        return;
      }

      toast.success("Account created! Please check your email to verify.");
      router.push(`/confirm-email?email=${encodeURIComponent(formData.email)}`);
    } catch {
      toast.error("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast.error(error.message);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Scale className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Join LawXP</CardTitle>
            <CardDescription>How would you like to get started?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <button
              onClick={() => setMode("owner")}
              className="w-full p-6 border-2 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">I&apos;m a Firm Owner</h3>
                  <p className="text-sm text-gray-500">Create my own firm, invite team members, manage everything</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode("employee")}
              className="w-full p-6 border-2 rounded-lg text-left hover:border-green-500 hover:bg-green-50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 group-hover:bg-green-200 transition-colors">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">I&apos;m a Team Member</h3>
                  <p className="text-sm text-gray-500">Join an existing firm using an invite code from my owner/partner</p>
                </div>
              </div>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">or</span>
              </div>
            </div>

            <Button onClick={handleGoogleSignup} className="w-full" variant="outline" disabled={googleLoading}>
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {googleLoading ? "Signing up..." : "Continue with Google"}
            </Button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between">
            <button onClick={() => setMode(null)} className="text-sm text-gray-500 hover:text-gray-700">
              ← Back
            </button>
            <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full ${mode === "owner" ? "bg-blue-100" : "bg-green-100"}`}>
              {mode === "owner" ? (
                <Briefcase className={`h-5 w-5 text-blue-600`} />
              ) : (
                <Users className={`h-5 w-5 text-green-600`} />
              )}
            </div>
            <div />
          </div>
          <CardTitle className="text-2xl mt-3">
            {mode === "owner" ? "Create Your Firm" : "Join Your Team"}
          </CardTitle>
          <CardDescription>
            {mode === "owner"
              ? "Set up your firm and start inviting team members"
              : "Enter the invite code from your firm owner"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "employee" && (
            <div className={`p-4 rounded-lg border-2 ${
              inviteValid === true ? "border-green-500 bg-green-50" :
              inviteValid === false ? "border-red-500 bg-red-50" :
              "border-gray-200"
            }`}>
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
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
                    validateInviteCode(val);
                  }}
                  className="font-mono text-lg tracking-wider"
                  maxLength={8}
                />
              </div>
              {validatingCode && (
                <p className="text-xs text-gray-500 mt-1">Validating...</p>
              )}
              {inviteValid === true && (
                <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Valid code — Role: {roleDisplayNames[inviteRole] || inviteRole}
                </p>
              )}
              {inviteValid === false && inviteCode.length >= 4 && (
                <p className="text-sm text-red-600 mt-1">
                  Invalid or already used code
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleEmailSignup} className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Advocate Rahul Sharma"
                  value={formData.full_name}
                  onChange={(e) => updateField("full_name", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  className="pl-10"
                  required
                  minLength={8}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {mode === "owner" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Firm / Chamber Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Sharma & Associates"
                    value={formData.firm_name}
                    onChange={(e) => updateField("firm_name", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || (mode === "employee" && !inviteValid)}
            >
              {loading
                ? "Creating Account..."
                : mode === "owner"
                ? "Create Firm & Account"
                : "Join Team"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
