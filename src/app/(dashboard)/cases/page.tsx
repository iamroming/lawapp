"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, getStatusColor } from "@/lib/utils";
import { Briefcase, Plus, Search, Filter, AlertTriangle, Download } from "lucide-react";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { PageSkeleton } from "@/components/skeleton";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";

interface Case {
  id: string;
  case_number: string;
  title: string;
  case_type: string;
  status: string;
  priority: string;
  court: string;
  next_hearing_date: string | null;
  client: { full_name: string } | null;
  created_at: string;
}

export default function CasesPage() {
  const { user: appUser } = useUser();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [caseLimit, setCaseLimit] = useState<{ used: number; limit: number; plan: string } | null>(null);
  const supabase = createClient();

  const fetchCaseLimit = async () => {
    try {
      const res = await fetch("/api/cases/limit-check");
      const data = await res.json();
      if (!data.error) {
        setCaseLimit({ used: data.used, limit: data.limit, plan: data.plan });
      }
    } catch {}
  };

  const fetchCases = async () => {
    if (!appUser) { setLoading(false); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, firm_id")
      .eq("id", appUser?.uuid)
      .single();

    const isOwner = profile?.role === "owner" || profile?.role === "partner" || profile?.role === "super_admin";

    if (isOwner && !profile?.firm_id) {
      setError("No firm associated with your account. Please contact support.");
      setLoading(false);
      return;
    }
    const firmId = profile?.firm_id as string;

    let query = supabase
      .from("cases")
      .select("*, client:clients(full_name)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (isOwner) {
      query = query.eq("firm_id", firmId);
    } else {
      query = query.or(`assigned_to.eq.${appUser?.uuid},created_by.eq.${appUser?.uuid}`);
    }

    const { data, error: queryError } = await query;

    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    if (data) {
      setCases(data as Case[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCases();
    fetchCaseLimit();

    const handleFocus = () => {
      fetchCases();
      fetchCaseLimit();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.case_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const { page, setPage, totalPages, paginatedItems } = usePagination(filteredCases);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cases</h1>
          <p className="text-gray-500">Manage all your cases in one place</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open("/api/export/cases-pdf", "_blank")}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => window.open("/api/export/cases-excel", "_blank")}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Link href="/cases/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Case
            </Button>
          </Link>
        </div>
      </div>

      {/* Case limit banner */}
      {caseLimit && caseLimit.limit !== -1 && (
        <div className={`p-4 rounded-lg border ${
          caseLimit.used >= caseLimit.limit
            ? "bg-red-50 border-red-200"
            : caseLimit.used >= caseLimit.limit * 0.8
            ? "bg-amber-50 border-amber-200"
            : "bg-[var(--surface-subtle)] border-[var(--border)]"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`h-5 w-5 ${
                caseLimit.used >= caseLimit.limit ? "text-red-500" :
                caseLimit.used >= caseLimit.limit * 0.8 ? "text-amber-500" :
                "text-[var(--text-secondary)]"
              }`} />
              <div>
                <p className="text-sm font-medium">
                  Cases: {caseLimit.used} / {caseLimit.limit}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {caseLimit.plan} plan
                </p>
              </div>
            </div>
            {caseLimit.used >= caseLimit.limit && (
              <a href="/subscription-required" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 whitespace-nowrap">
                Upgrade Plan
              </a>
            )}
          </div>
          {caseLimit.used >= caseLimit.limit && (
            <p className="text-xs text-red-600 mt-2">
              You&apos;ve reached your case limit. Upgrade to create more cases.
            </p>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search cases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="in-progress">In Progress</option>
          <option value="under-trial">Under Trial</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
          <option value="settled">Settled</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Cases List */}
      {loading ? (
        <div className="text-center py-12"><PageSkeleton /></div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : filteredCases.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-12 w-12" />}
          title="No cases found"
          description={search ? "Try adjusting your search terms" : "Create your first case to get started"}
          action={
            !search ? (
              <Link href="/cases/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Case
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
        <div className="grid gap-4">
          {paginatedItems.map((c) => (
            <Link key={c.id} href={`/cases/${c.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{c.title}</h3>
                        <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                        {c.priority === "urgent" && (
                          <Badge variant="destructive">Urgent</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{c.case_number}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span>Type: {c.case_type}</span>
                        {c.court && <span>Court: {c.court}</span>}
                        {c.client && <span>Client: {c.client.full_name}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      {c.next_hearing_date ? (
                        <div className="text-sm">
                          <p className="text-gray-500">Next Hearing</p>
                          <p className="font-medium">{formatDate(c.next_hearing_date)}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No hearing scheduled</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
