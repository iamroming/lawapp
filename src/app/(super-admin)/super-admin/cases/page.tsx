"use client";
import React, { useEffect, useState } from "react";
import { getSuperAdminCases, getSuperAdminFirms } from "@/app/actions/super-admin";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, getStatusColor } from "@/lib/utils";
import { Briefcase, Search, Building2 } from "lucide-react";
import type { CaseWithDetails } from "@/types/database";

interface FirmOption {
  id: string;
  full_name: string | null;
  email: string | null;
  firm_name: string | null;
  firm_id: string | null;
}

export default function SuperAdminCasesPage() {
  const [firms, setFirms] = useState<FirmOption[]>([]);
  const [selectedFirm, setSelectedFirm] = useState("");
  const [cases, setCases] = useState<CaseWithDetails[]>([]);
  const [loadingFirms, setLoadingFirms] = useState(true);
  const [loadingCases, setLoadingCases] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const loadFirms = async () => {
      try {
        const data = await getSuperAdminFirms();
        setFirms((data as FirmOption[]) || []);
      } catch {
        // Error loading firms
      } finally {
        setLoadingFirms(false);
      }
    };
    loadFirms();
  }, []);

  const handleFirmChange = async (ownerId: string) => {
    setSelectedFirm(ownerId);
    setCases([]);
    setSearch("");
    setStatusFilter("all");
    if (!ownerId) return;
    const firm = firms.find((f) => f.id === ownerId);
    const firmId = firm?.firm_id || ownerId;
    setLoadingCases(true);
    try {
      const data = await getSuperAdminCases(firmId);
      setCases((data as CaseWithDetails[]) || []);
    } catch {
      // Error loading cases
    } finally {
      setLoadingCases(false);
    }
  };

  const filtered = cases.filter((c) => {
    const match = c.title?.toLowerCase().includes(search.toLowerCase()) || c.case_number?.toLowerCase().includes(search.toLowerCase());
    const status = statusFilter === "all" || c.status === statusFilter;
    return match && status;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Briefcase className="h-6 w-6 text-purple-500" />Cases</h1>
        <p className="text-[var(--text-secondary)]">Select a firm to view its cases</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full sm:w-96">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
          <select
            value={selectedFirm}
            onChange={(e) => handleFirmChange(e.target.value)}
            className="w-full h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] pl-10 pr-3 py-2 text-sm"
            disabled={loadingFirms}
          >
            <option value="">{loadingFirms ? "Loading firms..." : "Select a firm..."}</option>
            {firms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.firm_name || f.full_name || "Unnamed firm"}{f.full_name ? ` — ${f.full_name}` : ""}
              </option>
            ))}
          </select>
        </div>
        {selectedFirm && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
            <Input placeholder="Search cases..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        )}
        {selectedFirm && (
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
            <option value="all">All Status</option>
            {["pending", "active", "in-progress", "under-trial", "won", "lost", "settled", "closed", "adjourned", "dismissed"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>

      {!selectedFirm ? (
        <EmptyState icon={<Building2 className="h-12 w-12" />} title="Select a firm" description="Choose a firm (owner) above to view its cases." />
      ) : loadingCases ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">Loading cases...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Briefcase className="h-12 w-12" />} title="No cases found" description="This firm has no cases yet." />
      ) : (
        <div className="grid gap-3">
          <p className="text-sm text-[var(--text-secondary)]">{cases.length} case{cases.length !== 1 ? "s" : ""} in this firm</p>
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
