"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { dbWrite } from "@/lib/db-write";
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
  Shield,
  KeyRound,
  FileText,
  Settings,
} from "lucide-react";
import { ROLE_DISPLAY_NAMES, ROLE_HIERARCHY } from "@/types/database";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions";
import toast from "react-hot-toast";
import { useUser } from "@/hooks/use-user";

type SettingsTab = "profile" | "notifications" | "billing" | "team" | "templates" | "invoice-settings";

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

export default function SettingsPage() {
  const { user: appUser } = useUser();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { hasPermission, userRole } = usePermissions();
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    hearingReminders: true,
    paymentAlerts: true,
    caseUpdates: true,
  });

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
  const [inviteCodeEmail, setInviteCodeEmail] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [generatingCode, setGeneratingCode] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userLimitError, setUserLimitError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchNotificationPreferences = async () => {
    try {
      if (!appUser) return;
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", appUser?.uuid)
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

  useEffect(() => {
    fetchNotificationPreferences();
  }, [appUser]);

  useEffect(() => {
    fetchSettings();
  }, [appUser]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      if (appUser) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", appUser?.uuid)
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

        const firmId = profileData?.firm_id || appUser?.uuid;

        // Fetch team members (same firm only)
        const { data: teamData } = await supabase
          .from("profiles")
          .select("id, full_name, email, role")
          .eq("firm_id", firmId)
          .neq("id", appUser?.uuid)
          .order("full_name");

        setTeamMembers((teamData as TeamMember[]) || []);

        // Fetch subscription (use firm owner's ID, not employee's)
        const subscriptionOwnerId = profileData?.firm_id || appUser?.uuid;
        const { data: subData } = await supabase
          .from("user_subscriptions")
          .select("*, plan:subscription_plans(*)")
          .eq("user_id", subscriptionOwnerId)
          .in("status", ["active", "trialing", "cancelled"])
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (subData) {
          const sub = subData as UserSubscription;
          sub.plan = Array.isArray(sub.plan) ? sub.plan[0] : sub.plan;
          setCurrentSubscription(sub);
        }

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
      if (!appUser) { toast.error("You must be logged in to continue"); return; }

      const { error } = await dbWrite("profiles", "update", {
        firm_name: billing.firmName,
        gstin: billing.gstin || null,
        address: billing.address || null,
        state: billing.state || null,
      }, { id: appUser?.uuid });

      if (error) {
        // If columns don't exist, just save firm_name
        const { error: fallbackError } = await dbWrite("profiles", "update", { firm_name: billing.firmName }, { id: appUser?.uuid });
        if (fallbackError) {
          console.error("Error saving billing:", fallbackError);
          toast.error("Failed to save billing details");
        } else {
          toast.success("Billing details saved (partial)!");
          fetchSettings();
        }
      } else {
        toast.success("Billing details saved!");
        fetchSettings();
      }
    } catch (error) {
      console.error("Unexpected error saving billing:", error);
      toast.error("An unexpected error occurred while saving billing details");
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
      const data = await res.json();
      if (!res.ok) {
        if (data.upgradeRequired) {
          setUserLimitError(data.error);
          toast.error(data.error);
        } else {
          throw new Error(data.error || "Failed to send invitation");
        }
        return;
      }
      toast.success(`Invitation sent to ${newMemberEmail}`);
      setNewMemberEmail("");
      setNewMemberRole("associate");
      setUserLimitError(null);
      fetchSettings();
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
    if (!inviteCodeEmail.trim()) {
      toast.error("Email is required for invite code");
      return;
    }
    setGeneratingCode(true);
    setGeneratedCode("");
    try {
      const res = await fetch("/api/team/invite-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_id: inviteCodeRole, email: inviteCodeEmail.trim(), expiresInDays: 7 }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.upgradeRequired) {
          setUserLimitError(data.error);
          toast.error(data.error);
        } else {
          throw new Error(data.error);
        }
        return;
      }
      setGeneratedCode(data.code);
      toast.success("Invite code generated!");
      setUserLimitError(null);
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
                  if (!appUser) return;
                  const { error } = await dbWrite("notification_preferences", "upsert", {
                    user_id: appUser?.uuid,
                    email: notifications.emailNotifications,
                    hearing_reminders: notifications.hearingReminders,
                    payment_alerts: notifications.paymentAlerts,
                    case_updates: notifications.caseUpdates,
                    updated_at: new Date().toISOString(),
                  });
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
                {/* User limit info */}
                {currentSubscription?.plan && currentSubscription.plan.max_users > 0 && (() => {
                  const isOwnerOrPartner = userRole === "owner" || userRole === "partner";
                  const atLimit = teamMembers.length + 1 >= currentSubscription.plan.max_users;
                  const nearLimit = teamMembers.length + 1 >= currentSubscription.plan.max_users * 0.8;
                  return (
                    <div className={`p-4 rounded-lg border ${
                      atLimit ? "bg-red-50 border-red-200" : nearLimit ? "bg-amber-50 border-amber-200" : "bg-[var(--surface-subtle)] border-[var(--border)]"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            Team Members: {teamMembers.length + 1} / {currentSubscription.plan.max_users === -1 ? "Unlimited" : currentSubscription.plan.max_users}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            {currentSubscription.plan.name} plan — {currentSubscription.plan.max_users === -1 ? "No limit on team members" : `Includes ${currentSubscription.plan.max_users} user(s) total`}
                          </p>
                        </div>
                        {atLimit && currentSubscription.plan.max_users !== -1 && (
                          isOwnerOrPartner ? (
                            <a href="/subscription" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 whitespace-nowrap">
                              Upgrade Plan
                            </a>
                          ) : (
                            <span className="text-sm text-[var(--text-secondary)] whitespace-nowrap">
                              Contact owner to upgrade
                            </span>
                          )
                        )}
                      </div>
                      {atLimit && currentSubscription.plan.max_users !== -1 && !isOwnerOrPartner && (
                        <p className="text-xs text-amber-700 mt-2">
                          Your firm has reached the user limit. Contact the firm owner to upgrade the plan.
                        </p>
                      )}
                    </div>
                  );
                })()}

                {userLimitError && (
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm font-medium text-red-800">{userLimitError}</p>
                    {(userRole === "owner" || userRole === "partner") ? (
                      <p className="text-xs text-red-600 mt-1">
                        Upgrade your plan to add more team members.{" "}
                        <a href="/subscription" className="font-semibold underline">View plans</a>
                      </p>
                    ) : (
                      <p className="text-xs text-red-600 mt-1">
                        Contact the firm owner to upgrade the plan and add more team members.
                      </p>
                    )}
                  </div>
                )}

                {hasPermission(PERMISSIONS.TEAM.INVITE) && (
                  <>
                    {/* Generate Invite Code */}
                    <div className="p-4 border rounded-lg bg-[var(--background)]">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <KeyRound className="h-4 w-4" />
                        Generate Invite Code
                      </h4>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Input
                          type="email"
                          placeholder="Invitee email"
                          value={inviteCodeEmail}
                          onChange={(e) => setInviteCodeEmail(e.target.value)}
                          className="flex-1"
                        />
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
