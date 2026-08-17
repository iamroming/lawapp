"use client";
import React, { useEffect, useState } from "react";
import { getSuperAdminUsers, toggleSuperAdminUserActive, changeSuperAdminUserRole, checkIfSuperAdmin } from "@/app/actions/super-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { Users, Search, Mail, Phone, Shield, Crown, UserX, UserCheck, Eye } from "lucide-react";
import { ROLE_DISPLAY_NAMES } from "@/types/database";
import Link from "next/link";
import toast from "react-hot-toast";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  firm_id: string | null;
  is_active: boolean;
  created_at: string;
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const data = await getSuperAdminUsers();
    const userList = (data as UserProfile[]) || [];
    setUsers(userList);
    setLoading(false);
  };

  const filteredUsers = users.filter((u) => {
    const match = u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const role = roleFilter === "all" || u.role === roleFilter;
    return match && role;
  });

  const toggleActive = async (userId: string, isActive: boolean) => {
    const isSuperAdmin = await checkIfSuperAdmin(userId);
    if (isSuperAdmin) {
      toast.error("Cannot deactivate a Super Admin user");
      return;
    }
    const action = isActive ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await toggleSuperAdminUserActive(userId, isActive);
      toast.success(isActive ? "User deactivated" : "User activated");
      fetchUsers();
    } catch {
      toast.error("Failed to update user status");
    }
  };

  const changeRole = async (userId: string, newRole: string) => {
    if (!window.confirm(`Are you sure you want to change this user's role to "${newRole}"?`)) return;
    try {
      await changeSuperAdminUserRole(userId, newRole);
      toast.success(`Role changed to ${newRole}`);
      fetchUsers();
    } catch {
      toast.error("Failed to change role");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-500" />
            All Users
          </h1>
          <p className="text-[var(--text-secondary)]">Full control over every user account ({users.length} total)</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
          <Input placeholder="Search by name, email, or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
          <option value="all">All Roles</option>
          <option value="super_admin">Super Admin</option>
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

      {loading ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">Loading users...</div>
      ) : filteredUsers.length === 0 ? (
        <EmptyState icon={<Users className="h-12 w-12" />} title="No users found" description="No users match your search" />
      ) : (
        <div className="grid gap-3">
          {filteredUsers.map((user) => {
            const isExpanded = expandedUser === user.id;
            return (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <Avatar name={user.full_name || user.email || "U"} size="lg" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{user.full_name || "Unnamed"}</h3>
                          <Badge variant={
                            user.role === "owner" || user.role === "super_admin" ? "destructive" :
                            user.role === "partner" ? "default" :
                            "secondary"
                          }>
                            {(user.role === "owner" || user.role === "partner" || user.role === "super_admin") && <Shield className="h-3 w-3 mr-1" />}
                            {ROLE_DISPLAY_NAMES[user.role] || user.role}
                          </Badge>
                          {!user.is_active && <Badge variant="outline" className="text-red-500 border-red-300">Inactive</Badge>}
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">{user.email}</p>
                        <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] mt-1">
                          <span>Joined {formatDate(user.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={user.role}
                        onChange={(e) => changeRole(user.id, e.target.value)}
                        className="h-8 rounded border border-[var(--border)] text-xs px-2"
                      >
                        <option value="super_admin">Super Admin</option>
                        <option value="owner">Owner</option>
                        <option value="partner">Partner</option>
                        <option value="senior_associate">Senior Associate</option>
                        <option value="associate">Associate</option>
                        <option value="junior_associate">Junior Associate</option>
                        <option value="paralegal">Paralegal</option>
                        <option value="intern">Intern</option>
                        <option value="office_admin">Office Admin</option>
                      </select>
                      <Button
                        variant={user.is_active ? "outline" : "default"}
                        size="sm"
                        onClick={() => toggleActive(user.id, user.is_active)}
                        disabled={user.role === "super_admin"}
                      >
                        {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                      <Link href={`/super-admin/users/${user.id}`}>
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
