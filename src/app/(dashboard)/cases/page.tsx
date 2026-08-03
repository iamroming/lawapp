"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, getStatusColor } from "@/lib/utils";
import { Briefcase, Plus, Search, Filter } from "lucide-react";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { PageSkeleton } from "@/components/skeleton";
import Link from "next/link";

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
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const supabase = createClient();

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isOwner = profile?.role === "owner" || profile?.role === "partner" || profile?.role === "super_admin";

    let query = supabase
      .from("cases")
      .select("*, client:clients(full_name)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (!isOwner) {
      query = query.or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`);
    }

    const { data, error } = await query;

    if (data) {
      setCases(data as Case[]);
    }
    setLoading(false);
  };

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.case_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const { page, setPage, totalPages, paginatedItems } = usePagination(filteredCases);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cases</h1>
          <p className="text-gray-500">Manage all your cases in one place</p>
        </div>
        <Link href="/cases/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Case
          </Button>
        </Link>
      </div>

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
