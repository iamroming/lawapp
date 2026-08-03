"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Select } from "@/components/ui/select";
import { formatDate, formatCurrency, getStatusColor, unwrap } from "@/lib/utils";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Shield,
  Briefcase,
  Receipt,
  Activity,
  UserCheck,
  UserX,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  firm_name: string;
  enrollment_number: string;
  is_active: boolean;
  specialization: string[];
  created_at: string;
}

interface UserCase {
  id: string;
  case_number: string;
  title: string;
  status: string;
  created_at: string;
}

interface UserSubscription {
  id: string;
  status: string;
  starts_at: string;
  expires_at: string;
  amount_paid: number;
  plan: { name: string; price: number } | null;
}

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_name: string;
  created_at: string;
  details: Record<string, unknown>;
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [cases, setCases] = useState<UserCase[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: userData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", params.id)
        .single();

      if (userData) {
        setUser(userData as UserProfile);

        const [casesRes, subRes, activityRes] = await Promise.all([
          supabase
            .from("cases")
            .select("id, case_number, title, status, created_at")
            .eq("created_by", params.id)
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("user_subscriptions")
            .select("*, plan:subscription_plans(name, price)")
            .eq("user_id", params.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single(),
          supabase
            .from("activity_logs")
            .select("*")
            .eq("user_id", params.id)
            .order("created_at", { ascending: false })
            .limit(20),
        ]);

        setCases((casesRes.data as UserCase[]) || []);
        if (subRes.data) {
          const sub = subRes.data;
          setSubscription({
            ...sub,
            plan: unwrap(sub.plan),
          } as UserSubscription);
        }
        setActivities((activityRes.data as ActivityLog[]) || []);
      }
      setLoading(false);
    };

    fetchUserData();
  }, [params.id, supabase]);

  const toggleActive = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !user.is_active })
      .eq("id", user.id);

    if (error) {
      toast.error(error.message);
      return;
    }
    setUser((prev) => (prev ? { ...prev, is_active: !prev.is_active } : null));
    toast.success(user.is_active ? "User deactivated" : "User activated");
  };

  const updateRole = async (newRole: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", user.id);

    if (error) {
      toast.error(error.message);
      return;
    }
    setUser((prev) => (prev ? { ...prev, role: newRole } : null));
    toast.success(`Role updated to ${newRole}`);
  };

  if (loading) {
    return <div className="text-center py-12 text-[var(--text-secondary)]">Loading user details...</div>;
  }

  if (!user) {
    return <div className="text-center py-12 text-[var(--text-secondary)]">User not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{user.full_name || "Unnamed User"}</h1>
            <Badge variant={user.role === "admin" ? "destructive" : "secondary"}>
              <Shield className="h-3 w-3 mr-1" />
              {user.role}
            </Badge>
            {!user.is_active && (
              <Badge variant="outline" className="text-red-500 border-red-300">
                Inactive
              </Badge>
            )}
          </div>
          <p className="text-[var(--text-secondary)] text-sm truncate">{user.email}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={toggleActive}>
            {user.is_active ? (
              <>
                <UserX className="h-4 w-4 mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                Activate
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar name={user.full_name || user.email} size="lg" />
                <div>
                  <h3 className="font-semibold text-lg">{user.full_name || "No name set"}</h3>
                  <p className="text-[var(--text-secondary)]">{user.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[var(--text-tertiary)]" />
                  <span>{user.phone || "Not provided"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-[var(--text-tertiary)]" />
                  <span>{user.firm_name || "No firm"}</span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">Bar Council No:</span>{" "}
                  <span className="font-medium">{user.enrollment_number || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">Joined:</span>{" "}
                  <span className="font-medium">{formatDate(user.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Management */}
          <Card>
            <CardHeader>
              <CardTitle>Role Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Select
                  options={[
                    { value: "admin", label: "Admin" },
                    { value: "lawyer", label: "Lawyer" },
                    { value: "paralegal", label: "Paralegal" },
                    { value: "staff", label: "Staff" },
                  ]}
                  value={user.role}
                  onChange={(e) => updateRole(e.target.value)}
                />
                <Button variant="outline" size="sm" onClick={() => updateRole(user.role)}>
                  Save Role
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Cases */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Cases ({cases.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {cases.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-center py-4">No cases created by this user.</p>
              ) : (
                <div className="space-y-3">
                  {cases.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{c.title}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{c.case_number}</p>
                      </div>
                      <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Subscription */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Subscription</CardTitle>
              <Link href="/admin/subscriptions">
                <Button variant="ghost" size="sm">Manage</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-secondary)]">Plan</span>
                    <span className="font-medium">{subscription.plan?.name || "Unknown"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-secondary)]">Status</span>
                    <Badge
                      variant={
                        subscription.status === "active"
                          ? "success"
                          : subscription.status === "cancelled"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {subscription.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-secondary)]">Amount Paid</span>
                    <span className="font-medium">
                      {formatCurrency(subscription.amount_paid)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-secondary)]">Start Date</span>
                    <span className="text-sm">{formatDate(subscription.starts_at)}</span>
                  </div>
                  {subscription.expires_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-secondary)]">Expires</span>
                      <span className="text-sm">{formatDate(subscription.expires_at)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-[var(--text-secondary)] mb-2">No active subscription</p>
                  <Link href="/admin/subscriptions">
                    <Button size="sm">Assign Plan</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-center py-4">No activity recorded.</p>
              ) : (
                <div className="space-y-3">
                  {activities.slice(0, 10).map((log) => (
                    <div key={log.id} className="text-sm">
                      <div className="flex items-start gap-2">
                        <Activity className="h-3 w-3 text-[var(--text-tertiary)] mt-1 shrink-0" />
                        <div>
                          <p>{log.action}</p>
                          {log.entity_name && (
                            <p className="text-[var(--text-secondary)] text-xs">{log.entity_name}</p>
                          )}
                          <p className="text-[var(--text-tertiary)] text-xs">{formatDate(log.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
