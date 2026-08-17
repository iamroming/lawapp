"use client";
import React, { useEffect, useState } from "react";
import { getSuperAdminClients, getSuperAdminFirms } from "@/app/actions/super-admin";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Users, Search, Phone, Mail, Building2 } from "lucide-react";
import Link from "next/link";
import type { Client, Profile } from "@/types/database";

type ClientWithCreator = Client & { creator: Profile | null };

interface FirmOption {
  id: string;
  full_name: string | null;
  email: string | null;
  firm_name: string | null;
  firm_id: string | null;
}

export default function SuperAdminClientsPage() {
  const [firms, setFirms] = useState<FirmOption[]>([]);
  const [selectedFirm, setSelectedFirm] = useState("");
  const [clients, setClients] = useState<ClientWithCreator[]>([]);
  const [loadingFirms, setLoadingFirms] = useState(true);
  const [loadingClients, setLoadingClients] = useState(false);
  const [search, setSearch] = useState("");

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
    setClients([]);
    setSearch("");
    if (!ownerId) return;
    const firm = firms.find((f) => f.id === ownerId);
    const firmId = firm?.firm_id || ownerId;
    setLoadingClients(true);
    try {
      const data = await getSuperAdminClients(firmId);
      setClients((data as ClientWithCreator[]) || []);
    } catch {
      // Error loading clients
    } finally {
      setLoadingClients(false);
    }
  };

  const filtered = clients.filter((c) =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-blue-500" />Clients</h1>
        <p className="text-[var(--text-secondary)]">Select a firm to view its clients</p>
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
            <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        )}
      </div>

      {!selectedFirm ? (
        <EmptyState icon={<Building2 className="h-12 w-12" />} title="Select a firm" description="Choose a firm (owner) above to view its clients." />
      ) : loadingClients ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">Loading clients...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users className="h-12 w-12" />} title="No clients found" description="This firm has no clients yet." />
      ) : (
        <div>
          <p className="text-sm text-[var(--text-secondary)] mb-3">{clients.length} client{clients.length !== 1 ? "s" : ""} in this firm</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <Link key={c.id} href="#">
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar name={c.full_name} size="lg" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{c.full_name}</h3>
                        {c.company_name && <p className="text-sm text-[var(--text-secondary)] truncate">{c.company_name}</p>}
                        <div className="mt-2 space-y-1">
                          {c.phone && <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]"><Phone className="h-3 w-3" />{c.phone}</div>}
                          {c.email && <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]"><Mail className="h-3 w-3" />{c.email}</div>}
                        </div>
                        {c.creator && <p className="text-xs text-[var(--text-tertiary)] mt-2">Added by: {c.creator.full_name}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
