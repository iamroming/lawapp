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
import { ArrowLeft, Mail, Phone, Building, Shield, Briefcase, Activity, Trash2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import type { Profile, UserRole, Case, AuditLog, SubscriptionWithPlan } from "@/types/database";

export default function SuperAdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<Profile | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [activities, setActivities] = useState<AuditLog[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionWithPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: u } = await supabase.from("profiles").select("*").eq("id", params.id).single();
      if (u) {
        setUser(u);
        const [cRes, aRes, sRes] = await Promise.all([
          supabase.from("cases").select("*").eq("created_by", params.id).order("created_at", { ascending: false }).limit(10),
          supabase.from("activity_logs").select("*").eq("user_id", params.id).order("created_at", { ascending: false }).limit(20),
          supabase.from("user_subscriptions").select("*, plan:subscription_plans(name, price)").eq("user_id", params.id).order("created_at", { ascending: false }).limit(1).single(),
        ]);
        setCases(cRes.data || []);
        setActivities(aRes.data || []);
        if (sRes.data) {
          setSubscription({
            ...sRes.data,
            plan: unwrap(sRes.data.plan),
          } as SubscriptionWithPlan);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [params.id, supabase]);

  const updateRole = async (role: string) => {
    await supabase.from("profiles").update({ role }).eq("id", params.id);
    setUser((prev) => prev ? { ...prev, role: role as UserRole } : null);
    toast.success("Role updated");
  };

  const toggleActive = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ is_active: !user.is_active }).eq("id", params.id);
    setUser((prev) => prev ? { ...prev, is_active: !prev.is_active } : null);
    toast.success(user.is_active ? "Deactivated" : "Activated");
  };

  const deleteUser = async () => {
    if (!confirm("PERMANENTLY delete this user? This cannot be undone.")) return;
    await supabase.from("profiles").delete().eq("id", params.id);
    toast.success("User deleted");
    router.push("/super-admin/users");
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!user) return <div className="text-center py-12 text-gray-500">User not found</div>;

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
          <p className="text-gray-500 text-sm truncate">{user.email}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={toggleActive}>{user.is_active ? "Deactivate" : "Activate"}</Button>
          <Button variant="destructive" size="sm" onClick={deleteUser}><Trash2 className="h-4 w-4 mr-1" />Delete User</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4">
                <Avatar name={user.full_name || user.email} size="lg" />
                <div>
                  <h3 className="font-semibold text-lg">{user.full_name}</h3>
                  <p className="text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" />{user.phone || "N/A"}</div>
                <div className="flex items-center gap-2"><Building className="h-4 w-4 text-gray-400" />{user.firm_name || "N/A"}</div>
                <div><span className="text-gray-500">Bar Council:</span> {user.enrollment_number || "N/A"}</div>
                <div><span className="text-gray-500">Joined:</span> {formatDate(user.created_at)}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Role Management</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Select
                  options={[{ value: "admin", label: "Admin" }, { value: "lawyer", label: "Lawyer" }, { value: "paralegal", label: "Paralegal" }, { value: "staff", label: "Staff" }]}
                  value={user.role}
                  onChange={(e) => updateRole(e.target.value)}
                />
                <Button onClick={() => updateRole(user.role)} size="sm">Save</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row justify-between">
              <CardTitle>Cases ({cases.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {cases.length === 0 ? <p className="text-gray-500 text-center py-4">No cases.</p> : (
                <div className="space-y-2">
                  {cases.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded border">
                      <div><p className="font-medium text-sm">{c.title}</p><p className="text-xs text-gray-500">{c.case_number}</p></div>
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
                  <div className="flex justify-between"><span className="text-gray-500">Plan</span><span className="font-medium">{subscription.plan?.name || "N/A"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Status</span><Badge variant={subscription.status === "active" ? "success" : "secondary"}>{subscription.status}</Badge></div>
                  <div className="flex justify-between"><span className="text-gray-500">Paid</span>{formatCurrency(subscription.amount_paid)}</div>
                </div>
              ) : <p className="text-gray-500 text-center py-4">No subscription</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Activity ({activities.length})</CardTitle></CardHeader>
            <CardContent>
              {activities.length === 0 ? <p className="text-gray-500 text-center py-4">No activity</p> : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {activities.map((a) => (
                    <div key={a.id} className="text-sm p-2 rounded border">
                      <p>{a.action} {a.entity_name || ""}</p>
                      <p className="text-xs text-gray-400">{formatDate(a.created_at)}</p>
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
