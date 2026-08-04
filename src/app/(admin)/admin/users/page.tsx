"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, unwrap } from "@/lib/utils";
import { Users, Search, Mail, Phone, Shield, UserPlus } from "lucide-react";
import { ROLE_DISPLAY_NAMES } from "@/types/database";
import Link from "next/link";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  firm_name: string;
  enrollment_number: string;
  is_active: boolean;
  created_at: string;
  subscription: {
    status: string;
    plan: { name: string } | null;
  } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const supabase = createClient();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, firm_id")
      .eq("id", user.id)
      .single();

    const isSuperAdmin = profile?.role === "super_admin";
    const firmId = profile?.firm_id || user.id;

    let query = supabase
      .from("profiles")
      .select(`
        *,
        subscription:user_subscriptions(
          status,
          plan:subscription_plans(name)
        )
      `);

    // Super admins see all users; firm owners/partners only see their firm
    if (!isSuperAdmin) {
      query = query.eq("firm_id", firmId);
    }

    const { data } = await query.order("created_at", { ascending: false });

    // Flatten subscription array
    const formatted = (data || []).map((u) => ({
      ...u,
      subscription: unwrap(u.subscription),
    }));

    setUsers(formatted as UserProfile[]);
    setLoading(false);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search) ||
      u.firm_name?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const toggleRole = async (userId: string, currentRole: string) => {
    // Cycle through roles: owner -> partner -> senior_associate -> associate -> junior_associate -> paralegal -> intern -> office_admin -> owner
    const roles = ["owner", "partner", "senior_associate", "associate", "junior_associate", "paralegal", "intern", "office_admin"];
    const currentIndex = roles.indexOf(currentRole);
    const newRole = roles[(currentIndex + 1) % roles.length];
    
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (!error) {
      fetchUsers();
    }
  };

  const toggleActive = async (userId: string, isActive: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !isActive })
      .eq("id", userId);

    if (!error) {
      fetchUsers();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-[var(--text-secondary)]">Manage all registered users on the platform</p>
        </div>
        <div className="text-sm text-[var(--text-secondary)]">
          {users.length} total users
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
          <Input
            placeholder="Search by name, email, phone, or firm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        >
          <option value="all">All Roles</option>
          <option value="owner">Owner</option>
          <option value="partner">Partner</option>
          <option value="senior_associate">Senior Associate</option>
          <option value="associate">Associate</option>
          <option value="junior_associate">Junior Associate</option>
          <option value="paralegal">Paralegal</option>
          <option value="intern">Intern</option>
          <option value="office_admin">Office Admin</option>
        </select>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">Loading users...</div>
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No users found"
          description={search ? "Try adjusting your search" : "No users registered yet"}
        />
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <Link key={user.id} href={`/admin/users/${user.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <Avatar name={user.full_name || user.email || "U"} size="lg" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{user.full_name || "Unnamed User"}</h3>
                          <Badge
                            variant={
                              user.role === "owner" ? "destructive" :
                              user.role === "partner" ? "default" :
                              "secondary"
                            }
                          >
                            {(user.role === "owner" || user.role === "partner") && <Shield className="h-3 w-3 mr-1" />}
                            {ROLE_DISPLAY_NAMES[user.role] || user.role}
                          </Badge>
                          {!user.is_active && (
                            <Badge variant="outline" className="text-red-500 border-red-300">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">{user.email}</p>
                        <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] mt-1">
                          {user.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {user.phone}
                            </span>
                          )}
                          {user.firm_name && <span>{user.firm_name}</span>}
                          <span>Joined {formatDate(user.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.subscription?.plan && (
                        <Badge variant="outline">
                          {user.subscription.plan.name}
                        </Badge>
                      )}
                      <Badge
                        variant={
                          user.subscription?.status === "active"
                            ? "success"
                            : user.subscription?.status === "cancelled"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {user.subscription?.status || "No plan"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
