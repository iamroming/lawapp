"use client";
import React, { useEffect, useState } from "react";
import { getSuperAdminCases } from "@/app/actions/super-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, getStatusColor } from "@/lib/utils";
import { Briefcase, Search } from "lucide-react";
import type { CaseWithDetails } from "@/types/database";

export default function SuperAdminCasesPage() {
  const [cases, setCases] = useState<CaseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => { fetchCases(); }, []);

  const fetchCases = async () => {
    const data = await getSuperAdminCases();
    setCases((data as CaseWithDetails[]) || []);
    setLoading(false);
  };

  const filtered = cases.filter((c) => {
    const match = c.title?.toLowerCase().includes(search.toLowerCase()) || c.case_number?.toLowerCase().includes(search.toLowerCase());
    const status = statusFilter === "all" || c.status === statusFilter;
    return match && status;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Briefcase className="h-6 w-6 text-purple-500" />All Cases</h1>
        <p className="text-[var(--text-secondary)]">View every case across all users ({cases.length} total)</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
          <Input placeholder="Search cases..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
          <option value="all">All Status</option>
          {["pending", "active", "in-progress", "under-trial", "won", "lost", "settled", "closed", "adjourned", "dismissed"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <div className="text-center py-12 text-[var(--text-secondary)]">Loading...</div> : (
        <div className="grid gap-3">
          {filtered.map((c) => (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{c.title}</h3>
                        <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] truncate">{c.case_number} | {c.case_type} | {c.court || "N/A"}</p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">
                        Client: {c.client?.full_name || "N/A"} | Assigned: {c.assigned?.full_name || "Unassigned"}
                      </p>
                    </div>
                    <div className="text-right text-sm text-[var(--text-secondary)] flex-shrink-0">
                      {c.next_hearing_date && <p>Next: {formatDate(c.next_hearing_date)}</p>}
                      <p>Created: {formatDate(c.created_at)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
          ))}
        </div>
      )}
    </div>
  );
}
