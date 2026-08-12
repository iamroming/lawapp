"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { dbWrite } from "@/lib/db-write";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { caseTypes } from "@/lib/utils";
import { getAllCourts } from "@/lib/india/courts";
import { getAvailableActs, getSectionsForAct } from "@/lib/legal/section-mappings";
import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useUser } from "@/hooks/use-user";

interface Client {
  id: string;
  full_name: string;
}

interface CaseData {
  id: string;
  title: string;
  description: string;
  case_type: string;
  court: string;
  judge_name: string;
  opposing_party: string;
  opposing_counsel: string;
  client_id: string;
  priority: string;
  filing_date: string;
  total_fee: number;
  acts: string[] | null;
  sections: string[] | null;
  clauses: string[] | null;
}

export default function EditCasePage() {
  const { user: appUser } = useUser();
  const params = useParams();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
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
  });
  const [selectedActs, setSelectedActs] = useState<string[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [clauses, setClauses] = useState<string[]>([]);
  const [newClause, setNewClause] = useState("");
  const availableActs = getAvailableActs();
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("firm_id")
        .eq("id", appUser?.uuid || "")
        .single();

      const [caseResult, clientsResult] = await Promise.all([
        supabase.from("cases").select("*").eq("id", params.id).single(),
        profile?.firm_id
          ? supabase.from("clients").select("id, full_name").eq("firm_id", profile.firm_id).order("full_name")
          : supabase.from("clients").select("id, full_name").order("full_name"),
      ]);

      if (caseResult.data) {
        const c = caseResult.data as CaseData;
        setFormData({
          title: c.title,
          description: c.description || "",
          case_type: c.case_type,
          court: c.court || "District Court",
          judge_name: c.judge_name || "",
          opposing_party: c.opposing_party || "",
          opposing_counsel: c.opposing_counsel || "",
          client_id: c.client_id || "",
          priority: c.priority,
          filing_date: c.filing_date || "",
          total_fee: c.total_fee ? String(c.total_fee) : "",
        });
        setSelectedActs(c.acts || []);
        setSelectedSections(c.sections || []);
        setClauses(c.clauses || []);
      }
      setClients(clientsResult.data || []);
      setFetching(false);
    };
    fetchData();
  }, [params.id, supabase]);

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

    const { error } = await dbWrite("cases", "update", {
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
      acts: selectedActs.length > 0 ? selectedActs : null,
      sections: selectedSections.length > 0 ? selectedSections : null,
      clauses: clauses.length > 0 ? clauses : null,
    }, { id: params.id, firm_id: profile?.firm_id });

    if (error) {
      toast.error(error);
      setLoading(false);
      return;
    }

    toast.success("Case updated successfully!");
    router.push(`/cases/${params.id}`);
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (fetching) {
    return <div className="text-center py-12 text-[var(--text-secondary)]">Loading case...</div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/cases/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Case</h1>
          <p className="text-[var(--text-secondary)]">Update case details</p>
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
                <Select
                  options={[
                    { value: "", label: "Select client..." },
                    ...clients.map((c) => ({ value: c.id, label: c.full_name })),
                  ]}
                  value={formData.client_id}
                  onChange={(e) => updateField("client_id", e.target.value)}
                />
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

        <div className="flex justify-end gap-3 mt-6">
          <Link href={`/cases/${params.id}`}>
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Case"}
          </Button>
        </div>
      </form>
    </div>
  );
}
