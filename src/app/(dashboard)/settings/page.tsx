"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { InvoiceTemplateSettings } from "@/components/settings/invoice-template-settings";
import { InvoiceSettingsPanel } from "@/components/settings/invoice-settings-panel";
import {
  User,
  Bell,
  Receipt,
  Users,
  CreditCard,
  Shield,
  KeyRound,
  FileText,
  Settings,
} from "lucide-react";
import { ROLE_DISPLAY_NAMES, ROLE_HIERARCHY } from "@/types/database";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions";
import toast from "react-hot-toast";

type SettingsTab = "profile" | "notifications" | "billing" | "team" | "subscription" | "templates" | "invoice-settings";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  firm_name: string;
  role: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  hearingReminders: boolean;
  paymentAlerts: boolean;
  caseUpdates: boolean;
}

interface BillingSettings {
  gstin: string;
  firmName: string;
  address: string;
  state: string;
}

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

// Team roles available for invitation (excluding owner and super_admin)
const TEAM_ROLE_OPTIONS = [
  { value: "partner", label: "Partner" },
  { value: "senior_associate", label: "Senior Associate" },
  { value: "associate", label: "Associate" },
  { value: "junior_associate", label: "Junior Associate" },
  { value: "paralegal", label: "Paralegal" },
  { value: "intern", label: "Intern" },
  { value: "office_admin", label: "Office Admin" },
];

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  billing_period: string;
  features: string[];
  max_cases: number;
  max_users: number;
  max_storage_mb: number;
}

interface UserSubscription {
  id: string;
  plan_id: string;
  status: string;
  starts_at: string;
  expires_at: string | null;
  payment_method: string | null;
  amount_paid: number;
  plan: SubscriptionPlan | null;
}

interface UsageStats {
  cases: number;
  storage: number;
  teamMembers: number;
}

function CouponInput() {
  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleApply = async () => {
    if (!code.trim()) return;
    setApplying(true);
    setResult(null);
    try {
      const res = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: `Coupon applied! You're now on the ${data.plan} plan.` });
        setCode("");
      } else {
        setResult({ success: false, message: data.error || "Invalid coupon" });
      }
    } catch {
      setResult({ success: false, message: "Failed to apply coupon" });
    }
    setApplying(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Enter coupon code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="font-mono"
        />
        <Button onClick={handleApply} disabled={applying || !code.trim()} variant="outline">
          {applying ? "Applying..." : "Apply"}
        </Button>
      </div>
      {result && (
        <p className={`text-sm ${result.success ? "text-green-600" : "text-red-500"}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { hasPermission, userRole } = usePermissions();
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    hearingReminders: true,
    paymentAlerts: true,
    caseUpdates: true,
  });

  useEffect(() => {
    fetchNotificationPreferences();
  }, []);

  const fetchNotificationPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setNotifications({
          emailNotifications: data.email ?? true,
          hearingReminders: data.hearing_reminders ?? true,
          paymentAlerts: data.payment_alerts ?? true,
          caseUpdates: data.case_updates ?? true,
        });
      }
    } catch (e) { console.error(e); }
  };
  const [billing, setBilling] = useState<BillingSettings>({
    gstin: "",
    firmName: "",
    address: "",
    state: "",
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("associate");
  const [inviteCodeRole, setInviteCodeRole] = useState("associate");
  const [generatedCode, setGeneratedCode] = useState("");
  const [generatingCode, setGeneratingCode] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<UsageStats>({ cases: 0, storage: 0, teamMembers: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
          setBilling({
            gstin: profileData.gstin || "",
            firmName: profileData.firm_name || "",
            address: profileData.address || "",
            state: profileData.state || "",
          });
        }

        // Fetch team members
        const { data: teamData } = await supabase
          .from("profiles")
          .select("id, full_name, email, role")
          .neq("id", user.id)
          .order("full_name");

        setTeamMembers((teamData as TeamMember[]) || []);

        // Fetch subscription plans
        const { data: plansData } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("is_active", true)
          .order("price");

        setPlans((plansData as SubscriptionPlan[]) || []);

        // Fetch user's current subscription
        const { data: subData } = await supabase
          .from("user_subscriptions")
          .select("*, plan:subscription_plans(*)")
          .eq("user_id", user.id)
          .in("status", ["active", "trialing"])
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (subData) {
          const sub = subData as UserSubscription;
          sub.plan = Array.isArray(sub.plan) ? sub.plan[0] : sub.plan;
          setCurrentSubscription(sub);
        }

        // Fetch usage stats
        const [casesRes, docsRes, membersRes] = await Promise.all([
          supabase.from("cases").select("id", { count: "exact", head: true }).eq("created_by", user.id).is("deleted_at", null),
          supabase.from("documents").select("file_size").eq("uploaded_by", user.id).is("deleted_at", null),
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_active", true),
        ]);

        const totalStorageBytes = (docsRes.data || []).reduce((sum: number, d: any) => sum + (d.file_size || 0), 0);
        setUsage({
          cases: casesRes.count || 0,
          storage: Math.round(totalStorageBytes / (1024 * 1024)),
          teamMembers: membersRes.count || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBilling = async () => {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          firm_name: billing.firmName,
          gstin: billing.gstin || null,
          address: billing.address || null,
          state: billing.state || null,
        })
        .eq("id", user.id);

      if (error) {
        // If columns don't exist, just save firm_name
        const { error: fallbackError } = await supabase
          .from("profiles")
          .update({ firm_name: billing.firmName })
          .eq("id", user.id);
        if (fallbackError) {
          console.error("Error saving billing:", fallbackError);
          toast.error("Failed to save");
        } else {
          toast.success("Saved!");
          fetchSettings();
        }
      } else {
        toast.success("Billing details saved!");
        fetchSettings();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail) return;

    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newMemberEmail, role: newMemberRole }),
      });
      if (!res.ok) throw new Error("Failed to send invitation");
      toast.success(`Invitation sent to ${newMemberEmail}`);
      setNewMemberEmail("");
      setNewMemberRole("associate");
    } catch {
      toast.error("Failed to send invitation. Make sure the email is registered.");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const res = await fetch(`/api/team/${memberId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove member");
      setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success("Member removed");
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    setGeneratedCode("");
    try {
      const res = await fetch("/api/team/invite-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_id: inviteCodeRole, expiresInDays: 7 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGeneratedCode(data.code);
      toast.success("Invite code generated!");
    } catch {
      toast.error("Failed to generate invite code");
    } finally {
      setGeneratingCode(false);
    }
  };

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
  { id: "notifications" as const, label: "Notifications", icon: Bell },
  { id: "billing" as const, label: "Billing", icon: Receipt },
  { id: "templates" as const, label: "Invoice Template", icon: FileText },
  { id: "invoice-settings" as const, label: "Invoice Settings", icon: Settings },
  { id: "team" as const, label: "Team", icon: Users },
  { id: "subscription" as const, label: "Subscription", icon: CreditCard },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--text-secondary)]">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-[var(--text-secondary)]">Manage your account and application preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <Card>
            <CardContent className="p-2">
              <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "bg-[var(--surface-subtle)] text-blue-700"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Profile Tab */}
          {activeTab === "profile" && <ProfileSettings />}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive updates via email</p>
                  </div>
                  <Toggle
                    checked={notifications.emailNotifications}
                    onChange={(checked) =>
                      setNotifications((p) => ({
                        ...p,
                        emailNotifications: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Hearing Reminders</p>
                    <p className="text-sm text-gray-500">Get reminders before hearings</p>
                  </div>
                  <Toggle
                    checked={notifications.hearingReminders}
                    onChange={(checked) =>
                      setNotifications((p) => ({
                        ...p,
                        hearingReminders: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Payment Alerts</p>
                    <p className="text-sm text-gray-500">Notifications for payments</p>
                  </div>
                  <Toggle
                    checked={notifications.paymentAlerts}
                    onChange={(checked) =>
                      setNotifications((p) => ({
                        ...p,
                        paymentAlerts: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Case Updates</p>
                    <p className="text-sm text-gray-500">Status changes and assignments</p>
                  </div>
                  <Toggle
                    checked={notifications.caseUpdates}
                    onChange={(checked) =>
                      setNotifications((p) => ({
                        ...p,
                        caseUpdates: checked,
                      }))
                    }
                  />
                </div>
                <Button onClick={async () => {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) return;
                  const { error } = await supabase.from("notification_preferences").upsert({
                    user_id: user.id,
                    email: notifications.emailNotifications,
                    hearing_reminders: notifications.hearingReminders,
                    payment_alerts: notifications.paymentAlerts,
                    case_updates: notifications.caseUpdates,
                    updated_at: new Date().toISOString(),
                  }, { onConflict: "user_id" });
                  if (error) {
                    toast.error("Failed to save preferences");
                  } else {
                    toast.success("Preferences saved!");
                  }
                }}>Save Preferences</Button>
              </CardContent>
            </Card>
          )}

          {/* Billing Tab */}
          {activeTab === "billing" && (
            <Card>
              <CardHeader>
                <CardTitle>Billing Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Firm Name</label>
                  <Input
                    value={billing.firmName}
                    onChange={(e) => setBilling((p) => ({ ...p, firmName: e.target.value }))}
                    placeholder="Your law firm name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">GSTIN</label>
                  <Input
                    value={billing.gstin}
                    onChange={(e) => setBilling((p) => ({ ...p, gstin: e.target.value }))}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Address</label>
                  <Input
                    value={billing.address}
                    onChange={(e) => setBilling((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Firm address"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">State</label>
                  <Input
                    value={billing.state}
                    onChange={(e) => setBilling((p) => ({ ...p, state: e.target.value }))}
                    placeholder="State"
                  />
                </div>
                <Button onClick={handleSaveBilling} disabled={saving}>
                  {saving ? "Saving..." : "Save Billing Details"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Team Tab */}
          {activeTab === "team" && (
            <Card>
              <CardHeader>
                <CardTitle>Team Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {hasPermission(PERMISSIONS.TEAM.INVITE) && (
                  <>
                    {/* Generate Invite Code */}
                    <div className="p-4 border rounded-lg bg-[var(--background)]">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <KeyRound className="h-4 w-4" />
                        Generate Invite Code
                      </h4>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Select
                          options={TEAM_ROLE_OPTIONS}
                          value={inviteCodeRole}
                          onChange={(e) => setInviteCodeRole(e.target.value)}
                          className="w-48"
                        />
                        <Button onClick={handleGenerateCode} disabled={generatingCode} variant="outline">
                          {generatingCode ? "Generating..." : "Generate Code"}
                        </Button>
                      </div>
                      {generatedCode && (
                        <div className="mt-3 p-3 bg-[var(--surface)] border rounded-lg flex items-center justify-between">
                          <code className="font-mono text-lg tracking-wider font-bold text-[var(--text-accent)]">
                            {generatedCode}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(generatedCode);
                              toast.success("Copied to clipboard!");
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-[var(--text-secondary)] mt-2">
                        Share this code with the person you want to invite. They&apos;ll enter it during signup.
                      </p>
                    </div>

                    {/* Add Member by Email */}
                    <div>
                      <h4 className="font-medium mb-3">Add by Email (existing users only)</h4>
                      <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3">
                        <Input
                          type="email"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                          placeholder="Email address"
                          className="flex-1"
                          required
                        />
                        <div className="flex gap-3">
                          <Select
                            options={TEAM_ROLE_OPTIONS}
                            value={newMemberRole}
                            onChange={(e) => setNewMemberRole(e.target.value)}
                            className="w-48"
                          />
                          <Button type="submit">Add Member</Button>
                        </div>
                      </form>
                    </div>
                  </>
                )}

                {!hasPermission(PERMISSIONS.TEAM.INVITE) && (
                  <p className="text-sm text-[var(--text-secondary)]">You don&apos;t have permission to invite team members.</p>
                )}

                {teamMembers.length === 0 ? (
                  <p className="text-[var(--text-secondary)] text-center py-4">No team members yet.</p>
                ) : (
                  <div className="space-y-3">
                    {teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{member.full_name}</p>
                          <p className="text-sm text-[var(--text-secondary)]">{member.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={
                            member.role === "owner" ? "destructive" :
                            member.role === "partner" ? "default" :
                            "secondary"
                          }>
                            {ROLE_DISPLAY_NAMES[member.role] || member.role}
                          </Badge>
                          {hasPermission(PERMISSIONS.TEAM.REMOVE) && member.role !== "owner" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Subscription Tab */}
          {activeTab === "subscription" && (
            <Card>
              <CardHeader>
                <CardTitle>Subscription & Billing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Plan */}
                {currentSubscription?.plan ? (
                  <div className="p-4 border-2 border-blue-500 rounded-lg bg-[var(--surface-subtle)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{currentSubscription.plan.name} Plan</h3>
                        <p className="text-[var(--text-secondary)]">{currentSubscription.plan.description}</p>
                      </div>
                      <Badge>{currentSubscription.status === "trialing" ? "Trial" : "Current Plan"}</Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-[var(--text-secondary)]">Cases</p>
                        <p className="font-medium">{currentSubscription.plan.max_cases === -1 ? "Unlimited" : currentSubscription.plan.max_cases}</p>
                      </div>
                      <div>
                        <p className="text-[var(--text-secondary)]">Team Members</p>
                        <p className="font-medium">{currentSubscription.plan.max_users === -1 ? "Unlimited" : currentSubscription.plan.max_users} included</p>
                      </div>
                      <div>
                        <p className="text-[var(--text-secondary)]">Storage</p>
                        <p className="font-medium">{currentSubscription.plan.max_storage_mb === -1 ? "Unlimited" : `${Math.round(currentSubscription.plan.max_storage_mb / 1024)} GB`}</p>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-[var(--text-secondary)]">
                      {currentSubscription.expires_at && <p>Next billing date: <strong>{new Date(currentSubscription.expires_at).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}</strong></p>}
                      {currentSubscription.payment_method && <p>Payment method: <strong>{currentSubscription.payment_method}</strong></p>}
                      <p>Amount: <strong>₹{currentSubscription.plan.price.toLocaleString("en-IN")}/month</strong></p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border-2 border-[var(--border)] rounded-lg bg-[var(--background)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">Free Plan</h3>
                        <p className="text-[var(--text-secondary)]">Basic access with limited features</p>
                      </div>
                      <Badge variant="secondary">Free</Badge>
                    </div>
                    <div className="mt-4 text-sm text-[var(--text-secondary)]">
                      <p>Upgrade to unlock more features and remove limits.</p>
                    </div>
                  </div>
                )}

                {/* Available Plans */}
                <div>
                  <h4 className="font-medium mb-3">Available Plans</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plans.map((plan) => {
                      const isCurrent = currentSubscription?.plan_id === plan.id;
                      const isFree = plan.price === 0;
                      return (
                        <div key={plan.id} className={`p-4 border rounded-lg ${isCurrent ? "border-blue-500 bg-[var(--surface-subtle)]" : ""}`}>
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{plan.name}</h4>
                            {isCurrent && <Badge>Current</Badge>}
                          </div>
                          <p className="text-2xl font-bold mt-2">
                            ₹{plan.price.toLocaleString("en-IN")}<span className="text-sm text-[var(--text-secondary)]">/{plan.billing_period === "yearly" ? "year" : "month"}</span>
                          </p>
                          <ul className="mt-3 space-y-1 text-sm text-[var(--text-secondary)]">
                            <li>• {plan.max_cases === -1 ? "Unlimited" : plan.max_cases} active cases</li>
                            <li>• {plan.max_users === -1 ? "Unlimited" : plan.max_users} user{(plan.max_users === -1 || plan.max_users > 1) ? "s" : ""}</li>
                            <li>• {plan.max_storage_mb === -1 ? "Unlimited" : `${Math.round(plan.max_storage_mb / 1024)} GB`} storage</li>
                            {(Array.isArray(plan.features) ? plan.features : typeof plan.features === "string" ? JSON.parse(plan.features) : []).slice(0, 2).map((f: string, i: number) => (
                              <li key={i}>• {f}</li>
                            ))}
                          </ul>
                          {!isCurrent && !isFree && (
                            <Button
                              variant={currentSubscription ? "outline" : "default"}
                              className="w-full mt-4"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const res = await fetch("/api/subscriptions", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      planSlug: plan.slug || plan.name?.toLowerCase(),
                                      billingCycle: plan.billing_period === "yearly" ? "annual" : "monthly",
                                    }),
                                  });
                                  const data = await res.json();
                                  if (data.error) {
                                    toast.error(data.error);
                                  } else if (data.short_url) {
                                    window.location.href = data.short_url;
                                  } else {
                                    toast.success(`Subscription created! Plan: ${plan.name}`);
                                    fetchSettings();
                                  }
                                } catch {
                                  toast.error("Failed to start subscription");
                                }
                              }}
                            >
                              {currentSubscription ? "Switch" : "Upgrade"}
                            </Button>
                          )}
                          {!isCurrent && isFree && !currentSubscription && (
                            <Button variant="outline" className="w-full mt-4" size="sm" disabled>
                              Free Plan
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Usage */}
                <div>
                  <h4 className="font-medium mb-3">Current Usage</h4>
                  <div className="space-y-3">
                    <div>
                      {(() => {
                        const maxCases = currentSubscription?.plan?.max_cases ?? 3;
                        const displayLimit = maxCases === -1 ? "Unlimited" : maxCases;
                        const pct = maxCases === -1 ? Math.min(usage.cases * 2, 20) : Math.min((usage.cases / maxCases) * 100, 100);
                        return (
                          <>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Cases</span>
                              <span className="text-[var(--text-secondary)]">{usage.cases} / {displayLimit}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <div>
                      {(() => {
                        const maxStorage = currentSubscription?.plan?.max_storage_mb ?? 100;
                        const displayLimit = maxStorage === -1 ? "Unlimited" : `${Math.round(maxStorage / 1024)} GB`;
                        const pct = maxStorage === -1 ? Math.min(usage.storage * 0.5, 20) : Math.min((usage.storage / maxStorage) * 100, 100);
                        return (
                          <>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Storage</span>
                              <span className="text-[var(--text-secondary)]">{usage.storage} MB / {displayLimit}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <div>
                      {(() => {
                        const maxUsers = currentSubscription?.plan?.max_users ?? 1;
                        const displayLimit = maxUsers === -1 ? "Unlimited" : maxUsers;
                        const pct = maxUsers === -1 ? Math.min(usage.teamMembers * 5, 20) : Math.min((usage.teamMembers / maxUsers) * 100, 100);
                        return (
                          <>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Team Members</span>
                              <span className="text-[var(--text-secondary)]">{usage.teamMembers} / {displayLimit}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Apply Coupon */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Have a coupon code?</h4>
                  <CouponInput />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Templates Tab */}
          {activeTab === "templates" && (
            <InvoiceTemplateSettings />
          )}

          {/* Invoice Settings Tab */}
          {activeTab === "invoice-settings" && (
            <InvoiceSettingsPanel />
          )}

        </div>
      </div>
    </div>
  );
}
