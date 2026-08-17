"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Users, Plus, Search, Phone, Mail, Download } from "lucide-react";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { PageSkeleton } from "@/components/skeleton";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";

interface Client {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company_name: string;
  city: string;
  created_at: string;
}

export default function ClientsPage() {
  const { user: appUser } = useUser();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchClients();

    const handleFocus = () => {
      fetchClients();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const fetchClients = async () => {
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

    let query = supabase.from("clients").select("*").is("deleted_at", null).order("full_name");
    if (isOwner) {
      query = query.eq("firm_id", firmId);
    } else {
      query = query.eq("created_by", appUser?.uuid);
    }

    const { data, error: queryError } = await query;
    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }
    setClients(data || []);
    setLoading(false);
  };

  const filteredClients = clients.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

  const { page, setPage, totalPages, paginatedItems } = usePagination(filteredClients);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-gray-500">Manage your client database</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open("/api/export/clients-pdf", "_blank")}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => window.open("/api/export/clients-excel", "_blank")}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Link href="/clients/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search clients by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-12"><PageSkeleton /></div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No clients found"
          description={search ? "Try adjusting your search" : "Add your first client to get started"}
          action={
            !search ? (
              <Link href="/clients/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedItems.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={client.full_name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{client.full_name}</h3>
                      {client.company_name && (
                        <p className="text-sm text-gray-500 truncate">{client.company_name}</p>
                      )}
                      <div className="mt-2 space-y-1">
                        {client.phone && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </div>
                        )}
                        {client.email && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{client.email}</span>
                          </div>
                        )}
                      </div>
                      {client.city && (
                        <p className="text-xs text-gray-400 mt-1">{client.city}</p>
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
