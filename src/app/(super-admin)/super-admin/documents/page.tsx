"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Search, Trash2, Download } from "lucide-react";
import { formatDate, unwrap } from "@/lib/utils";
import toast from "react-hot-toast";
import type { DocumentWithCase } from "@/types/database";

export default function SuperAdminDocumentsPage() {
  const [docs, setDocs] = useState<DocumentWithCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const supabase = createClient();

  useEffect(() => { fetchDocs(); }, []);

  const fetchDocs = async () => {
    const { data } = await supabase.from("documents").select("*, case:cases(title, case_number), uploader:profiles(full_name)").order("created_at", { ascending: false });
    setDocs(
      (data || []).map((d) => ({
        ...d,
        case: unwrap(d.case),
        uploader: unwrap(d.uploader),
      })) as DocumentWithCase[]
    );
    setLoading(false);
  };

  const deleteDoc = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    await supabase.from("documents").delete().eq("id", id);
    toast.success("Deleted");
    fetchDocs();
  };

  const filtered = docs.filter((d) => d.title?.toLowerCase().includes(search.toLowerCase()) || d.file_name?.toLowerCase().includes(search.toLowerCase()));

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6 text-indigo-500" />All Documents</h1>
      <p className="text-[var(--text-secondary)]">Every document uploaded across the platform ({docs.length} total)</p>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
        <Input placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {loading ? <div className="text-center py-12 text-[var(--text-secondary)]">Loading...</div> : (
        <div className="grid gap-3">
          {filtered.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium truncate">{doc.title}</h3>
                      <p className="text-sm text-[var(--text-secondary)] truncate">{doc.file_name}{doc.file_size != null ? ` | ${formatSize(doc.file_size)}` : ""}</p>
                      <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)] mt-1 flex-wrap">
                        {doc.uploader && <span>By: {doc.uploader.full_name}</span>}
                        {doc.case && <span>Case: {doc.case.case_number}</span>}
                        <span>{formatDate(doc.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    {doc.is_confidential && <Badge variant="destructive" className="text-xs">Confidential</Badge>}
                    <Badge variant="secondary" className="text-xs">{doc.category}</Badge>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button></a>
                    <Button variant="ghost" size="icon" onClick={() => deleteDoc(doc.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
