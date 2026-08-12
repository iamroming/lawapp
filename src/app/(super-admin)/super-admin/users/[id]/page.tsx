"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSuperAdminUserDetail, getSuperAdminUserCases, getSuperAdminUserActivities, getSuperAdminUserSubscription, toggleSuperAdminUserActive, changeSuperAdminUserRole, checkIfSuperAdmin, softDeleteSuperAdminUser } from "@/app/actions/super-admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Select } from "@/components/ui/select";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import { ArrowLeft, Mail, Phone, Building, Shield, Briefcase, Activity, Trash2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import type { Profile, UserRole, Case, AuditLog, SubscriptionWithPlan } from "@/types/database";
import { useUser } from "@/hooks/use-user";

export default function SuperAdminUserDetailPage() {
  const { user: appUser } = useUser();
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<Profile | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [activities, setActivities] = useState<AuditLog[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionWithPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isTargetSuperAdmin, setIsTargetSuperAdmin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (appUser) {
          const cu = await getSuperAdminUserDetail(appUser.uuid);
          setCurrentUser(cu);
        }
        const u = await getSuperAdminUserDetail(params.id as string);
        if (u) {
          setUser(u);
          const isSA = await checkIfSuperAdmin(params.id as string);
          setIsTargetSuperAdmin(isSA);
          const [cData, aData, sData] = await Promise.all([
            getSuperAdminUserCases(params.id as string),
            getSuperAdminUserActivities(params.id as string),
            getSuperAdminUserSubscription(params.id as string),
          ]);
          setCases(cData as Case[]);
          setActivities(aData as AuditLog[]);
          if (sData) {
            setSubscription(sData as SubscriptionWithPlan);
          }
        }
      } catch {
        // Error fetching data
      }
      setLoading(false);
    };
    fetchData();
  }, [params.id, appUser]);

  const updateRole = async (role: string) => {
    if (role === "super_admin") {
      toast.error("Cannot assign Super Admin role through this interface");
      return;
    }
    try {
      await changeSuperAdminUserRole(params.id as string, role);
      setUser((prev) => prev ? { ...prev, role: role as UserRole } : null);
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  };

  const toggleActive = async () => {
    if (!appUser) return;
    if (isTargetSuperAdmin) {
      toast.error("Cannot deactivate a Super Admin user");
      return;
    }
    try {
      await toggleSuperAdminUserActive(params.id as string, user?.is_active ?? true);
      setUser((prev) => prev ? { ...prev, is_active: !prev.is_active } : null);
      toast.success(user?.is_active ? "Deactivated" : "Activated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const deleteUser = async () => {
    if (currentUser && currentUser.id === params.id) {
      toast.error("You cannot delete your own account");
      return;
    }
    if (user && user.role === "super_admin") {
      toast.error("Cannot delete a Super Admin user");
      return;
    }
    if (!confirm("PERMANENTLY delete this user? This cannot be undone.")) return;
    try {
      await softDeleteSuperAdminUser(params.id as string);
      toast.success("User deleted");
      router.push("/super-admin/users");
    } catch {
      toast.error("Failed to delete user");
    }
  };

  if (loading) return <div className="text-center py-12 text-[var(--text-secondary)]">Loading...</div>;
  if (!appUser || !user) return <div className="text-center py-12 text-[var(--text-secondary)]">User not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/super-admin/users"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{user.full_name || "Unnamed"}</h1>
            <Badge variant={user.role === "owner" ? "destructive" : "secondary"}><Shield className="h-3 w-3 mr-1" />{user.role}</Badge>
            {!user.is_active && <Badge variant="outline" className="text-red-500 border-red-300">Inactive</Badge>}
          </div>
          <p className="text-[var(--text-secondary)] text-sm truncate">{appUser?.email}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={toggleActive} disabled={isTargetSuperAdmin}>{user.is_active ? "Deactivate" : "Activate"}</Button>
          <Button variant="destructive" size="sm" onClick={deleteUser} disabled={(currentUser && currentUser.id === params.id) || user.role === "super_admin"}><Trash2 className="h-4 w-4 mr-1" />Delete User</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4">
                <Avatar name={user.full_name || appUser?.email || "U"} size="lg" />
                <div>
                  <h3 className="font-semibold text-lg">{user.full_name}</h3>
                  <p className="text-[var(--text-secondary)]">{appUser?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-[var(--text-tertiary)]" />{user.phone || "N/A"}</div>
                <div className="flex items-center gap-2"><Building className="h-4 w-4 text-[var(--text-tertiary)]" />{user.firm_name || "N/A"}</div>
                <div><span className="text-[var(--text-secondary)]">Bar Council:</span> {user.enrollment_number || "N/A"}</div>
                <div><span className="text-[var(--text-secondary)]">Joined:</span> {formatDate(user.created_at)}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Role Management</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Select
                  options={[
                    { value: "owner", label: "Owner" },
                    { value: "partner", label: "Partner" },
                    { value: "senior_associate", label: "Senior Associate" },
                    { value: "associate", label: "Associate" },
                    { value: "junior_associate", label: "Junior Associate" },
                    { value: "paralegal", label: "Paralegal" },
                    { value: "intern", label: "Intern" },
                    { value: "office_admin", label: "Office Admin" },
                  ]}
                  value={user.role}
                  onChange={(e) => updateRole(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row justify-between">
              <CardTitle>Recent Cases ({cases.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {cases.length === 0 ? <p className="text-[var(--text-secondary)] text-center py-4">No cases.</p> : (
                <div className="space-y-2">
                  {cases.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded border">
                      <div><p className="font-medium text-sm">{c.title}</p><p className="text-xs text-[var(--text-secondary)]">{c.case_number}</p></div>
                      <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Subscription</CardTitle></CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Plan</span><span className="font-medium">{subscription.plan?.name || "N/A"}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Status</span><Badge variant={subscription.status === "active" ? "success" : "secondary"}>{subscription.status}</Badge></div>
                  <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Paid</span>{formatCurrency(subscription.amount_paid)}</div>
                </div>
              ) : <p className="text-[var(--text-secondary)] text-center py-4">No subscription</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Activity ({activities.length})</CardTitle></CardHeader>
            <CardContent>
              {activities.length === 0 ? <p className="text-[var(--text-secondary)] text-center py-4">No activity</p> : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {activities.map((a) => (
                    <div key={a.id} className="text-sm p-2 rounded border">
                      <p>{a.action} {a.entity_name || ""}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{formatDate(a.created_at)}</p>
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
