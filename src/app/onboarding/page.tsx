"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, Phone, Building, Briefcase, Users, KeyRound, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

type OnboardingMode = null | "owner" | "employee";

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<OnboardingMode>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteValid, setInviteValid] = useState<boolean | null>(null);
  const [inviteRole, setInviteRole] = useState("");
  const [validatingCode, setValidatingCode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
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

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "employee" && !inviteValid) {
      toast.error("Please enter a valid invite code");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      if (mode === "owner") {
        const { error } = await supabase.from("profiles").upsert({
          id: user.id,
          full_name: formData.full_name || user.user_metadata?.full_name || "",
          email: user.email || "",
          phone: formData.phone,
          firm_name: formData.firm_name,
          role: "owner",
          firm_id: user.id,
          is_active: true,
        }, { onConflict: "id" });

        if (error) {
          toast.error(error.message);
          setLoading(false);
          return;
        }
      } else {
        const redeemRes = await fetch("/api/team/redeem-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: inviteCode.trim() }),
        });
        const redeemData = await redeemRes.json();
        if (!redeemRes.ok) {
          toast.error(redeemData.error || "Failed to apply invite code");
          setLoading(false);
          return;
        }

        await supabase.from("profiles").update({
          full_name: formData.full_name || user.user_metadata?.full_name || "",
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        }).eq("id", user.id);
      }

      toast.success("Welcome to LawXP!");
      router.push("/pricing");
    } catch {
      toast.error("An unexpected error occurred");
      setLoading(false);
    }
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-8">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-accent)]">
              <Scale className="h-6 w-6 text-[var(--text-accent)]" />
            </div>
            <CardTitle className="text-2xl">Welcome to LawXP</CardTitle>
            <CardDescription>Complete your profile to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <button
              onClick={() => setMode("owner")}
              className="w-full p-6 border-2 rounded-lg text-left hover:border-blue-500 hover:bg-[var(--surface-subtle)] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-accent)] group-hover:bg-blue-200 transition-colors">
                  <Briefcase className="h-6 w-6 text-[var(--text-accent)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">I&apos;m a Firm Owner</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Create my own firm and invite team members</p>
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
                  <p className="text-sm text-[var(--text-secondary)]">Join an existing firm with an invite code</p>
                </div>
              </div>
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between">
            <button onClick={() => setMode(null)} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              ← Back
            </button>
            <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full ${mode === "owner" ? "bg-[var(--surface-accent)]" : "bg-green-100"}`}>
              {mode === "owner" ? <Briefcase className="h-5 w-5 text-[var(--text-accent)]" /> : <Users className="h-5 w-5 text-green-600" />}
            </div>
            <div />
          </div>
          <CardTitle className="text-2xl mt-3">
            {mode === "owner" ? "Set Up Your Firm" : "Enter Invite Code"}
          </CardTitle>
          <CardDescription>
            {mode === "owner"
              ? "Enter your details to create your firm"
              : "Enter the invite code from your firm owner"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "employee" && (
            <div className={`p-4 rounded-lg border-2 ${
              inviteValid === true ? "border-green-500 bg-green-50" :
              inviteValid === false ? "border-red-500 bg-red-50" :
              "border-[var(--border)]"
            }`}>
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                <KeyRound className="h-4 w-4" />
                Invite Code
              </label>
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
              {validatingCode && <p className="text-xs text-[var(--text-secondary)] mt-1">Validating...</p>}
              {inviteValid === true && (
                <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Role: {roleDisplayNames[inviteRole] || inviteRole}
                </p>
              )}
              {inviteValid === false && inviteCode.length >= 4 && (
                <p className="text-sm text-red-600 mt-1">Invalid or already used code</p>
              )}
            </div>
          )}

          <form onSubmit={handleComplete} className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                placeholder="Your full name"
                value={formData.full_name}
                onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            {mode === "owner" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Firm / Chamber Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                  <Input
                    placeholder="Sharma & Associates"
                    value={formData.firm_name}
                    onChange={(e) => setFormData((p) => ({ ...p, firm_name: e.target.value }))}
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
              {loading ? "Setting up..." : mode === "owner" ? "Create Firm" : "Join Team"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
