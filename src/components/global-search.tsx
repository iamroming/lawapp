"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/modal";
import { Search, Briefcase, Users, FileText, ArrowRight, Receipt, Calendar, Tag } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  type: "case" | "client" | "document" | "invoice" | "hearing" | "tag";
  title: string;
  subtitle: string;
  href: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  const search = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      const term = q.toLowerCase();

      // Get user's firm_id for scoping (BUG #8 fix)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("firm_id")
        .eq("id", user.id)
        .single();

      const firmId = profile?.firm_id || user.id;

      const [casesRes, clientsRes, docsRes, invoicesRes, hearingsRes, tagsRes] = await Promise.all([
        supabase
          .from("cases")
          .select("id, title, case_number, status")
          .eq("firm_id", firmId)
          .or(`title.ilike.%${term}%,case_number.ilike.%${term}%`)
          .limit(5),
        supabase
          .from("clients")
          .select("id, full_name, email, phone")
          .eq("firm_id", firmId)
          .or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
          .limit(5),
        supabase
          .from("documents")
          .select("id, title, file_name, file_type")
          .eq("firm_id", firmId)
          .or(`title.ilike.%${term}%,file_name.ilike.%${term}%`)
          .limit(5),
        supabase
          .from("invoices")
          .select("id, invoice_number, client:clients(full_name), amount, status")
          .eq("firm_id", firmId)
          .or(`invoice_number.ilike.%${term}%`)
          .limit(5),
        supabase
          .from("hearings")
          .select("id, hearing_date, court, case:cases(case_number, title)")
          .eq("firm_id", firmId)
          .ilike("court", `%${term}%`)
          .limit(5),
        supabase
          .from("tags")
          .select("id, name, color")
          .eq("firm_id", firmId)
          .ilike("name", `%${term}%`)
          .limit(5),
      ]);

      const mapped: SearchResult[] = [
        ...(casesRes.data || []).map((c: any) => ({
          id: c.id,
          type: "case" as const,
          title: c.title,
          subtitle: `${c.case_number} · ${c.status}`,
          href: `/cases/${c.id}`,
        })),
        ...(clientsRes.data || []).map((c: any) => ({
          id: c.id,
          type: "client" as const,
          title: c.full_name,
          subtitle: [c.email, c.phone].filter(Boolean).join(" · "),
          href: `/clients/${c.id}`,
        })),
        ...(docsRes.data || []).map((d: any) => ({
          id: d.id,
          type: "document" as const,
          title: d.title || d.file_name,
          subtitle: d.file_type || "Document",
          href: "/documents",
        })),
        ...(invoicesRes.data || []).map((inv: any) => {
          const client = Array.isArray(inv.client) ? inv.client[0] : inv.client;
          return {
            id: inv.id,
            type: "invoice" as const,
            title: inv.invoice_number,
            subtitle: `₹${inv.amount?.toLocaleString("en-IN") || 0} · ${client?.full_name || "N/A"} · ${inv.status}`,
            href: "/billing",
          };
        }),
        ...(hearingsRes.data || []).map((h: any) => {
          const caseData = Array.isArray(h.case) ? h.case[0] : h.case;
          return {
            id: h.id,
            type: "hearing" as const,
            title: `${caseData?.case_number || "Case"} - ${h.court || "Court"}`,
            subtitle: h.hearing_date || "No date",
            href: `/calendar`,
          };
        }),
        ...(tagsRes.data || []).map((t: any) => ({
          id: t.id,
          type: "tag" as const,
          title: t.name,
          subtitle: "Tag",
          href: "/documents",
        })),
      ];

      setResults(mapped);
      setLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const typeIcons: Record<string, React.ReactNode> = {
    case: <Briefcase className="h-4 w-4 text-blue-500" />,
    client: <Users className="h-4 w-4 text-green-500" />,
    document: <FileText className="h-4 w-4 text-purple-500" />,
    invoice: <Receipt className="h-4 w-4 text-orange-500" />,
    hearing: <Calendar className="h-4 w-4 text-red-500" />,
    tag: <Tag className="h-4 w-4 text-yellow-500" />,
  };

  const typeLabels: Record<string, string> = {
    case: "Cases",
    client: "Clients",
    document: "Documents",
    invoice: "Invoices",
    hearing: "Hearings",
    tag: "Tags",
  };

  const grouped = results.reduce(
    (acc, r) => {
      (acc[r.type] = acc[r.type] || []).push(r);
      return acc;
    },
    {} as Record<string, SearchResult[]>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 transition-colors w-full sm:w-64"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="ml-auto hidden sm:inline-flex items-center gap-0.5 rounded border bg-white px-1.5 text-[10px] font-medium text-gray-500">
          <span className="text-xs">Ctrl</span>+K
        </kbd>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Search">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search cases, clients, documents, invoices, hearings..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {loading && (
            <p className="text-center text-sm text-gray-500 py-4">Searching...</p>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-4">No results found</p>
          )}

          {!loading && Object.keys(grouped).length > 0 && (
            <div className="max-h-80 overflow-y-auto space-y-4">
              {Object.entries(grouped).map(([type, items]) => (
                <div key={type}>
                  <p className="text-xs font-medium text-gray-400 uppercase mb-2">
                    {typeLabels[type]}
                  </p>
                  {items.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        router.push(r.href);
                        setOpen(false);
                      }}
                      className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-50 text-left transition-colors"
                    >
                      {typeIcons[r.type]}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.title}</p>
                        <p className="text-xs text-gray-500 truncate">{r.subtitle}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

          {query.length < 2 && (
            <p className="text-center text-sm text-gray-400 py-4">
              Type at least 2 characters to search
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
