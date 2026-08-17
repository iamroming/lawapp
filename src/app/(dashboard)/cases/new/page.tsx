"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { dbWrite } from "@/lib/db-write";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { caseTypes, generateCaseNumber } from "@/lib/utils";
import { getAllCourts } from "@/lib/india/courts";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { getAvailableActs, getSectionsForAct } from "@/lib/legal/section-mappings";
import { ArrowLeft, Upload, X, FileText, Loader2, HardDrive, Plus } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useUser } from "@/hooks/use-user";

interface Client {
  id: string;
  full_name: string;
}

interface PendingFile {
  file: File;
  title: string;
  category: string;
  uploading: boolean;
  progress: number;
}

const CATEGORY_OPTIONS = [
  { value: "petition", label: "Petition" },
  { value: "affidavit", label: "Affidavit" },
  { value: "evidence", label: "Evidence" },
  { value: "judgment", label: "Judgment" },
  { value: "agreement", label: "Agreement" },
  { value: "correspondence", label: "Correspondence" },
  { value: "other", label: "Other" },
];

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function NewCasePage() {
  const { user: appUser } = useUser();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [storageUsed, setStorageUsed] = useState<number | null>(null);
  const [storageLimit, setStorageLimit] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    case_type: "Civil",
    court: "District Court",
    judge_name: "",
    opposing_party: "",
    opposing_counsel: "",
    client_id: "",
    priority: "medium",
    filing_date: "",
    total_fee: "",
    advance_amount: "",
    next_payment_date: "",
  });
  const [selectedActs, setSelectedActs] = useState<string[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [clauses, setClauses] = useState<string[]>([]);
  const [newClause, setNewClause] = useState("");
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);
  const availableActs = getAvailableActs();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchClients = async () => {
      if (!appUser) return;
      const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", appUser?.uuid).single();
      if (!profile?.firm_id) return;
      const { data } = await supabase.from("clients").select("id, full_name").eq("firm_id", profile.firm_id).order("full_name");
      setClients(data || []);
    };
    fetchClients();

    const fetchStorage = async () => {
      if (!appUser) return;
      const { data } = await supabase
        .from("documents")
        .select("file_size")
        .eq("uploaded_by", appUser?.uuid)
        .is("deleted_at", null);
      if (data) {
        const total = data.reduce((sum: number, doc: { file_size: number | null }) => sum + (doc.file_size || 0), 0);
        setStorageUsed(total);
      }
    };
    fetchStorage();
  }, [supabase]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPending: PendingFile[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`${file.name} exceeds ${MAX_FILE_SIZE_MB} MB limit`);
        continue;
      }
      newPending.push({
        file,
        title: file.name.replace(/\.[^/.]+$/, ""),
        category: "other",
        uploading: false,
        progress: 0,
      });
    }

    setPendingFiles((prev) => [...prev, ...newPending]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePendingFile = (index: number, field: "title" | "category", value: string) => {
    setPendingFiles((prev) => prev.map((f, i) => i === index ? { ...f, [field]: value } : f));
  };

  const getTotalPendingSize = () => pendingFiles.reduce((sum, f) => sum + f.file.size, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.title.trim().length < 3) {
      toast.error("Case title must be at least 3 characters");
      setLoading(false);
      return;
    }

    if (formData.total_fee && parseFloat(formData.total_fee) < 0) {
      toast.error("Fee cannot be negative");
      setLoading(false);
      return;
    }

    if (formData.advance_amount && parseFloat(formData.advance_amount) < 0) {
      toast.error("Advance amount cannot be negative");
      setLoading(false);
      return;
    }

    if (formData.advance_amount && formData.total_fee && parseFloat(formData.advance_amount) > parseFloat(formData.total_fee)) {
      toast.error("Advance amount cannot exceed total fee");
      setLoading(false);
      return;
    }

    if (formData.filing_date) {
      const filingDate = new Date(formData.filing_date);
      if (filingDate > new Date()) {
        toast.error("Filing date cannot be in the future");
        setLoading(false);
        return;
      }
    }

    if (!appUser) { toast.error("You must be logged in to continue"); setLoading(false); return; }

    const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", appUser?.uuid).single();

    // Pre-flight case limit check
    try {
      const checkRes = await fetch("/api/cases/limit-check");
      const check = await checkRes.json();
      if (!check.allowed) {
        toast.error(check.message || "Case limit reached. Upgrade your plan to add more cases.");
        setLoading(false);
        return;
      }
    } catch {
      // If check fails, proceed (Supabase insert will go through regardless)
    }

    const { data: caseData, error } = await dbWrite("cases", "insert", {
      case_number: generateCaseNumber(),
      firm_id: profile?.firm_id,
      title: formData.title,
      description: formData.description,
      case_type: formData.case_type,
      court: formData.court,
      judge_name: formData.judge_name,
      opposing_party: formData.opposing_party,
      opposing_counsel: formData.opposing_counsel,
      client_id: formData.client_id || null,
      priority: formData.priority,
      filing_date: formData.filing_date || null,
      total_fee: formData.total_fee ? parseFloat(formData.total_fee) : 0,
      advance_amount: formData.advance_amount ? parseFloat(formData.advance_amount) : 0,
      next_payment_date: formData.next_payment_date || null,
      amount_received: formData.advance_amount ? parseFloat(formData.advance_amount) : 0,
      status: "pending",
      created_by: appUser?.uuid,
      acts: selectedActs.length > 0 ? selectedActs : null,
      sections: selectedSections.length > 0 ? selectedSections : null,
      clauses: clauses.length > 0 ? clauses : null,
    });

    if (error) {
      toast.error(error);
      setLoading(false);
      return;
    }

    if (pendingFiles.length > 0 && caseData) {
      // Pre-flight storage check
      try {
        const totalPendingBytes = pendingFiles.reduce((sum, f) => sum + f.file.size, 0);
        const checkRes = await fetch("/api/documents/storage-check");
        const check = await checkRes.json();
        if (!check.allowed) {
          toast.error(`Storage limit reached (${check.usedMB} MB of ${check.limit} MB). Upgrade your plan to upload more files.`);
          setLoading(false);
          return;
        }
        if (check.limit > 0 && (check.used + totalPendingBytes) >= check.limit * 1024 * 1024) {
          toast.error(`These files will exceed your storage limit of ${check.limit} MB. Remove some files or upgrade your plan.`);
          setLoading(false);
          return;
        }
      } catch {
        // If check fails, proceed (API route has its own enforcement)
      }

      let uploadErrors = 0;
      for (let i = 0; i < pendingFiles.length; i++) {
        const pf = pendingFiles[i];
        setPendingFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, uploading: true } : f));

        try {
          const result = await uploadToCloudinary(pf.file, "CaseFiles/documents");
          const docRes = await fetch("/api/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: pf.title,
              case_id: caseData.id,
              file_url: result.secure_url,
              file_name: pf.file.name,
              file_type: pf.file.type,
              file_size: pf.file.size,
              category: pf.category,
            }),
          });
          if (!docRes.ok) {
            const errData = await docRes.json();
            if (docRes.status === 403) {
              toast.error(errData.error || "Storage limit reached");
            }
            uploadErrors++;
          }
        } catch {
          uploadErrors++;
        }

        setPendingFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, uploading: false, progress: 100 } : f));
      }

      if (uploadErrors > 0) {
        toast.error(`${uploadErrors} of ${pendingFiles.length} documents failed to upload`);
        setLoading(false);
        return;
      }
    }

    toast.success("Case created successfully!");
    router.push("/cases");
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) {
      toast.error("Client name is required");
      return;
    }
    if (!appUser) return;
    setCreatingClient(true);
    try {
      const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", appUser.uuid).single();
      const { data, error } = await supabase.from("clients").insert({
        full_name: newClientName.trim(),
        email: newClientEmail.trim() || null,
        phone: newClientPhone.trim() || null,
        firm_id: profile?.firm_id || appUser.uuid,
        created_by: appUser.uuid,
      }).select("id, full_name").single();

      if (error) {
        toast.error("Failed to create client");
        return;
      }

      setClients((prev) => [...prev, data].sort((a, b) => a.full_name.localeCompare(b.full_name)));
      setFormData((prev) => ({ ...prev, client_id: data.id }));
      setShowNewClient(false);
      setNewClientName("");
      setNewClientEmail("");
      setNewClientPhone("");
      toast.success("Client created!");
    } catch {
      toast.error("Failed to create client");
    } finally {
      setCreatingClient(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/cases">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Case</h1>
          <p className="text-[var(--text-secondary)]">Register a new case in the system</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Case Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Case Title *</label>
              <Input
                placeholder="e.g., John Doe vs. ABC Corp"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Case Type *</label>
                <Select
                  options={caseTypes.map((t) => ({ value: t, label: t }))}
                  value={formData.case_type}
                  onChange={(e) => updateField("case_type", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Court</label>
                <Select
                  options={getAllCourts().map((c) => ({ value: c.name, label: `${c.name} (${c.nameHi})` }))}
                  value={formData.court}
                  onChange={(e) => updateField("court", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Client</label>
                {clients.length === 0 && !showNewClient ? (
                  <div className="flex items-center gap-2">
                    <Select
                      options={[{ value: "", label: "No clients yet..." }]}
                      value=""
                      onChange={() => {}}
                      disabled
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewClient(true)}
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Create
                    </Button>
                  </div>
                ) : (
                  <Select
                    options={[
                      { value: "", label: "Select client..." },
                      ...clients.map((c) => ({ value: c.id, label: c.full_name })),
                    ]}
                    value={formData.client_id}
                    onChange={(e) => updateField("client_id", e.target.value)}
                  />
                )}
                {!showNewClient && clients.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowNewClient(true)}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add new client
                  </button>
                )}
                {showNewClient && (
                  <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg space-y-2">
                    <p className="text-xs font-medium text-blue-800">New Client</p>
                    <Input
                      placeholder="Full name *"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Email"
                        type="email"
                        value={newClientEmail}
                        onChange={(e) => setNewClientEmail(e.target.value)}
                      />
                      <Input
                        placeholder="Phone"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleCreateClient}
                        disabled={creatingClient || !newClientName.trim()}
                      >
                        {creatingClient ? "Creating..." : "Save Client"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowNewClient(false);
                          setNewClientName("");
                          setNewClientEmail("");
                          setNewClientPhone("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  options={[
                    { value: "low", label: "Low" },
                    { value: "medium", label: "Medium" },
                    { value: "high", label: "High" },
                    { value: "urgent", label: "Urgent" },
                  ]}
                  value={formData.priority}
                  onChange={(e) => updateField("priority", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Judge Name</label>
              <Input
                placeholder="Hon'ble Justice..."
                value={formData.judge_name}
                onChange={(e) => updateField("judge_name", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Opposing Party</label>
                <Input
                  placeholder="Name of opposing party"
                  value={formData.opposing_party}
                  onChange={(e) => updateField("opposing_party", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Opposing Counsel</label>
                <Input
                  placeholder="Advocate name"
                  value={formData.opposing_counsel}
                  onChange={(e) => updateField("opposing_counsel", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Filing Date</label>
                <Input
                  type="date"
                  value={formData.filing_date}
                  onChange={(e) => updateField("filing_date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Fee (INR)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.total_fee}
                  onChange={(e) => updateField("total_fee", e.target.value)}
                />
              </div>
            </div>

            {formData.total_fee && parseFloat(formData.total_fee) > 0 && (
              <div className="p-4 bg-[var(--surface-subtle)] border border-blue-200 rounded-lg space-y-4">
                <p className="text-sm font-medium text-blue-800">Fee Payment Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Advance Amount (INR)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.advance_amount}
                      onChange={(e) => updateField("advance_amount", e.target.value)}
                    />
                    <p className="text-xs text-[var(--text-secondary)]">Amount paid upfront by client</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Next Payment Date</label>
                    <Input
                      type="date"
                      value={formData.next_payment_date}
                      onChange={(e) => updateField("next_payment_date", e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />
                    <p className="text-xs text-[var(--text-secondary)]">When remaining amount is due</p>
                  </div>
                </div>
                {formData.advance_amount && parseFloat(formData.advance_amount) > 0 && (
                  <div className="text-sm text-blue-700">
                    <p>Advance: Rs. {parseFloat(formData.advance_amount).toLocaleString("en-IN")}</p>
                    <p>Remaining: Rs. {(parseFloat(formData.total_fee) - parseFloat(formData.advance_amount)).toLocaleString("en-IN")}</p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Brief description of the case..."
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={4}
              />
            </div>

            {/* Acts, Sections & Clauses */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-4">
              <p className="text-sm font-medium text-amber-800">Acts, Sections & Clauses (for Case Law Research)</p>
              <div className="space-y-2">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Applicable Acts</label>
                <div className="flex flex-wrap gap-2">
                  {availableActs.map((act) => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => {
                        setSelectedActs((prev) =>
                          prev.includes(act) ? prev.filter((a) => a !== act) : [...prev, act]
                        );
                        setSelectedSections([]);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        selectedActs.includes(act)
                          ? "bg-amber-600 text-white border-amber-600"
                          : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-amber-400"
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </div>

              {selectedActs.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Sections</label>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {selectedActs.flatMap((act) =>
                      getSectionsForAct(act).map((s) => (
                        <button
                          key={`${act}-${s.section}`}
                          type="button"
                          onClick={() => {
                            setSelectedSections((prev) =>
                              prev.includes(s.section)
                                ? prev.filter((sec) => sec !== s.section)
                                : [...prev, s.section]
                            );
                          }}
                          className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                            selectedSections.includes(s.section)
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-blue-400"
                          }`}
                          title={s.title}
                        >
                          S. {s.section}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Custom Clauses / Provisions</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newClause}
                    onChange={(e) => setNewClause(e.target.value)}
                    placeholder="e.g., Section 138 NI Act, Order VII Rule 11 CPC"
                    className="flex-1 px-3 py-1.5 text-sm border rounded-md"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newClause.trim() && !clauses.includes(newClause.trim())) {
                          setClauses((prev) => [...prev, newClause.trim()]);
                          setNewClause("");
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (newClause.trim() && !clauses.includes(newClause.trim())) {
                        setClauses((prev) => [...prev, newClause.trim()]);
                        setNewClause("");
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {clauses.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {clauses.map((clause, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--surface)] border border-[var(--border)] rounded text-xs"
                      >
                        {clause}
                        <button
                          type="button"
                          onClick={() => setClauses((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-[var(--text-tertiary)] hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Documents
              </span>
              <span className="text-xs font-normal text-[var(--text-secondary)]">Optional — Max {MAX_FILE_SIZE_MB} MB per file</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-[var(--surface-subtle)]/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto text-[var(--text-tertiary)] mb-2" />
              <p className="text-sm text-[var(--text-secondary)]">Click to upload or drag and drop</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">PDF, Images, Documents — up to {MAX_FILE_SIZE_MB} MB each</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.txt,.rtf"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {pendingFiles.length > 0 && (
              <>
                {storageUsed !== null && (
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <HardDrive className="h-3 w-3" />
                    Current usage: {formatBytes(storageUsed)}
                    {storageLimit !== null && storageLimit > 0 && ` / ${formatBytes(storageLimit)}`}
                  </div>
                )}

                <div className="space-y-3">
                  {pendingFiles.map((pf, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-[var(--background)]">
                      <FileText className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={pf.title}
                            onChange={(e) => updatePendingFile(i, "title", e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border rounded"
                            placeholder="Document title"
                          />
                          <select
                            value={pf.category}
                            onChange={(e) => updatePendingFile(i, "category", e.target.value)}
                            className="px-2 py-1 text-sm border rounded"
                          >
                            {CATEGORY_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                          <span>{pf.file.name}</span>
                          <span>({formatBytes(pf.file.size)})</span>
                          {pf.uploading && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                          {pf.progress === 100 && !pf.uploading && <span className="text-green-600">Done</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePendingFile(i)}
                        className="text-[var(--text-tertiary)] hover:text-red-500"
                        disabled={pf.uploading}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-[var(--text-secondary)]">
                  {pendingFiles.length} file(s) — {formatBytes(getTotalPendingSize())} total
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Link href="/cases">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Case"}
          </Button>
        </div>
      </form>
    </div>
  );
}
