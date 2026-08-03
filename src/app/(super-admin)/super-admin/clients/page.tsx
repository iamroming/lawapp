"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Users, Search, Phone, Mail } from "lucide-react";
import { unwrap } from "@/lib/utils";
import Link from "next/link";
import type { Client, Profile } from "@/types/database";

type ClientWithCreator = Client & { creator: Profile | null };

export default function SuperAdminClientsPage() {
  const [clients, setClients] = useState<ClientWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const supabase = createClient();

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("*, creator:profiles(full_name)").order("created_at", { ascending: false });
    const formatted = (data || []).map((c) => ({ ...c, creator: unwrap(c.creator) }));
    setClients(formatted);
    setLoading(false);
  };

  const filtered = clients.filter((c) =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-blue-500" />All Clients</h1>
        <p className="text-gray-500">Every client across the platform ({clients.length} total)</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {loading ? <div className="text-center py-12 text-gray-500">Loading...</div> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Link key={c.id} href={`/clients/${c.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={c.full_name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{c.full_name}</h3>
                      {c.company_name && <p className="text-sm text-gray-500 truncate">{c.company_name}</p>}
                      <div className="mt-2 space-y-1">
                        {c.phone && <div className="flex items-center gap-1 text-xs text-gray-500"><Phone className="h-3 w-3" />{c.phone}</div>}
                        {c.email && <div className="flex items-center gap-1 text-xs text-gray-500"><Mail className="h-3 w-3" />{c.email}</div>}
                      </div>
                      {c.creator && <p className="text-xs text-gray-400 mt-2">Added by: {c.creator.full_name}</p>}
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
