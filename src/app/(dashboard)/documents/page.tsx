"use client";
import React, { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { uploadToCloudinary, deleteFromCloudinary, getCloudinaryPublicId } from "@/lib/cloudinary";
import { FileText, Upload, Search, Download, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { PageSkeleton } from "@/components/skeleton";

interface Document {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  category: string;
  is_confidential: boolean;
  created_at: string;
  case: { title: string; case_number: string } | null;
}

interface CaseOption {
  id: string;
  case_number: string;
  title: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const [newDoc, setNewDoc] = useState({
    title: "",
    description: "",
    case_id: "",
    category: "other",
    is_confidential: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) { setLoading(false); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, firm_id")
      .eq("id", user.id)
      .single();

    const isOwner = profile?.role === "owner" || profile?.role === "partner" || profile?.role === "super_admin";
    const firmId = profile?.firm_id || user.id;

    const docsQuery = supabase
      .from("documents")
      .select("*, case:cases(title, case_number)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    const casesQuery = supabase.from("cases").select("id, case_number, title").is("deleted_at", null).order("title");

    if (isOwner) {
      docsQuery.eq("firm_id", firmId);
      casesQuery.eq("firm_id", firmId);
    } else {
      docsQuery.eq("uploaded_by", user.id);
      casesQuery.or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`);
    }

    const [docsRes, casesRes] = await Promise.all([docsQuery, casesQuery]);
    setDocuments((docsRes.data as Document[]) || []);
    setCases((casesRes.data as CaseOption[]) || []);
    setLoading(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);

    // Upload file to Cloudinary
    let cloudinaryUrl: string;
    try {
      const result = await uploadToCloudinary(selectedFile, "LawXP/documents");
      cloudinaryUrl = result.secure_url;
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
      setUploading(false);
      return;
    }

    // Register via API (enforces storage limit check)
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newDoc.title,
          description: newDoc.description,
          case_id: newDoc.case_id || null,
          file_url: cloudinaryUrl,
          file_name: selectedFile.name,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          category: newDoc.category,
          is_confidential: newDoc.is_confidential,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save document");
        setUploading(false);
        return;
      }
    } catch {
      toast.error("Failed to save document");
      setUploading(false);
      return;
    }

    toast.success("Document uploaded!");
    setShowModal(false);
    setSelectedFile(null);
    setNewDoc({ title: "", description: "", case_id: "", category: "other", is_confidential: false });
    fetchData();
    setUploading(false);
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm("Delete this document?")) return;

    const { error } = await supabase
      .from("documents")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", doc.id);
    if (error) {
      toast.error(error.message);
      return;
    }

    if (doc.file_url) {
      const publicId = getCloudinaryPublicId(doc.file_url);
      if (publicId) {
        try { await deleteFromCloudinary(publicId); } catch (e) { console.error(e); }
      }
    }

    toast.success("Document deleted");
    fetchData();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const handleDownload = async (doc: Document) => {
    try {
      const res = await fetch(`/api/documents/${doc.id}/download`);
      if (!res.ok) {
        toast.error("Failed to get download link");
        return;
      }
      const { url } = await res.json();
      window.open(url, "_blank");
    } catch {
      toast.error("Download failed");
    }
  };

  const filteredDocs = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.file_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-[var(--text-secondary)]">Manage and organize your legal documents</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
        <Input
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-12"><PageSkeleton /></div>
      ) : filteredDocs.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="No documents found"
          description={search ? "Try adjusting your search" : "Upload your first document"}
          action={
            !search ? (
              <Button onClick={() => setShowModal(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4">
          {filteredDocs.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--surface-subtle)] flex items-center justify-center">
                      <FileText className="h-5 w-5 text-[var(--text-accent)]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium truncate">{doc.title}</h3>
                      <p className="text-sm text-[var(--text-secondary)] truncate">{doc.file_name}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-[var(--text-secondary)]">
                        <span>{formatFileSize(doc.file_size || 0)}</span>
                        <span>{formatDate(doc.created_at)}</span>
                        {doc.case && (
                          <span className="truncate">
                            {doc.case.case_number} - {doc.case.title}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {doc.is_confidential && (
                      <Badge variant="destructive" className="text-xs hidden sm:inline-flex">
                        Confidential
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                      {doc.category}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(doc)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Upload Document">
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">File *</label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-[var(--text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[var(--surface-subtle)] file:text-[var(--text-accent)] hover:file:bg-[var(--surface-accent)]"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Title *</label>
            <Input
              value={newDoc.title}
              onChange={(e) => setNewDoc((p) => ({ ...p, title: e.target.value }))}
              placeholder="Document title"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={newDoc.description}
              onChange={(e) => setNewDoc((p) => ({ ...p, description: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Case</label>
            <Select
              options={[
                { value: "", label: "Select case" },
                ...cases.map((c) => ({ value: c.id, label: `${c.case_number} - ${c.title}` })),
              ]}
              value={newDoc.case_id}
              onChange={(e) => setNewDoc((p) => ({ ...p, case_id: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select
              options={[
                { value: "petition", label: "Petition" },
                { value: "affidavit", label: "Affidavit" },
                { value: "evidence", label: "Evidence" },
                { value: "judgment", label: "Judgment" },
                { value: "agreement", label: "Agreement" },
                { value: "correspondence", label: "Correspondence" },
                { value: "other", label: "Other" },
              ]}
              value={newDoc.category}
              onChange={(e) => setNewDoc((p) => ({ ...p, category: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="confidential"
              checked={newDoc.is_confidential}
              onChange={(e) => setNewDoc((p) => ({ ...p, is_confidential: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="confidential" className="text-sm">
              Mark as confidential
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
