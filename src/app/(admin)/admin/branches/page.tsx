"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/ui/stats-card";
import { Building2, Plus, Users, Briefcase, MapPin, ArrowRight, AlertCircle, Crown } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

interface Branch {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  employee_count: number;
  is_active: boolean;
}

export default function BranchesPage() {
  const { user: appUser } = useUser();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchLimit, setBranchLimit] = useState<{ used: number; max: number; plan: string } | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      if (!appUser) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("firm_id, role")
        .eq("id", appUser.uuid)
        .single();

      setIsOwner(["owner", "partner"].includes(profile?.role || ""));

      const firmId = profile?.firm_id || appUser.uuid;

      // Fetch branches
      const res = await fetch("/api/branches");
      const data = await res.json();
      if (Array.isArray(data)) {
        setBranches(data);
      }

      // Fetch branch limit
      const { data: subData } = await supabase
        .from("user_subscriptions")
        .select("plan:subscription_plans(name, max_branches)")
        .eq("user_id", firmId)
        .in("status", ["active", "trialing", "cancelled"])
        .limit(1)
        .single();

      const plan = subData?.plan ? (Array.isArray(subData.plan) ? subData.plan[0] : subData.plan) : null;
      setBranchLimit({
        used: data?.length || 0,
        max: plan?.max_branches ?? 0,
        plan: plan?.name || "Free",
      });

      setLoading(false);
    };
    fetchData();
  }, [appUser, supabase]);

  if (loading) {
    return <div className="text-center py-12 text-[var(--text-secondary)]">Loading branches...</div>;
  }

  const canCreate = branchLimit && (branchLimit.max === -1 || branchLimit.used < branchLimit.max);
  const soloPlan = branchLimit?.max === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Branches</h1>
          <p className="text-[var(--text-secondary)]">Manage your firm&apos;s branch offices</p>
        </div>
        {isOwner && canCreate && (
          <Link href="/admin/branches/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Branch
            </Button>
          </Link>
        )}
      </div>

      {/* Branch limit banner */}
      {branchLimit && (
        <div className={`p-4 rounded-lg border ${
          soloPlan
            ? "bg-amber-50 border-amber-200"
            : !canCreate
            ? "bg-red-50 border-red-200"
            : "bg-[var(--surface-subtle)] border-[var(--border)]"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-[var(--text-secondary)]" />
              <div>
                <p className="text-sm font-medium">
                  Branches: {branchLimit.used} / {branchLimit.max === -1 ? "Unlimited" : branchLimit.max}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {branchLimit.plan} plan
                </p>
              </div>
            </div>
            {(soloPlan || !canCreate) && (
              <a href="/subscription-required" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 whitespace-nowrap">
                Upgrade Plan
              </a>
            )}
          </div>
          {soloPlan && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-amber-200">
              <div className="flex items-start gap-2">
                <Crown className="h-4 w-4 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Branches available on Firm plan and above</p>
                  <p className="text-xs text-amber-600 mt-1">
                    Upgrade to Firm (₹1,999/mo) to create up to 3 branches, or Enterprise for 10 branches.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Branches grid */}
      {branches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No branches yet</h3>
            <p className="text-[var(--text-secondary)] mb-4">
              {soloPlan
                ? "Upgrade to Firm plan to create branches"
                : "Create your first branch to organize your firm's offices"}
            </p>
            {isOwner && canCreate && (
              <Link href="/admin/branches/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Branch
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <Link key={branch.id} href={`/admin/branches/${branch.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{branch.name}</h3>
                        {(branch.city || branch.state) && (
                          <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {[branch.city, branch.state].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[var(--text-tertiary)]" />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {branch.employee_count} employees
                    </span>
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
