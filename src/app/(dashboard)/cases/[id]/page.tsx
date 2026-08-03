"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate, getStatusColor, formatCurrency } from "@/lib/utils";
import { ArrowLeft, Calendar, User, Scale, FileText, Edit, Trash2, RefreshCw, ExternalLink, Download, Search, Bell, BellOff, CheckCircle, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import Link from "next/link";
import toast from "react-hot-toast";

interface CaseDetail {
  id: string;
  case_number: string;
  title: string;
  description: string;
  case_type: string;
  court: string;
  court_room: string;
  judge_name: string;
  opposing_party: string;
  opposing_counsel: string;
  status: string;
  priority: string;
  filing_date: string;
  next_hearing_date: string;
  total_fee: number;
  amount_received: number;
  created_at: string;
  acts: string[] | null;
  sections: string[] | null;
  clauses: string[] | null;
  client: { id: string; full_name: string; phone: string; email: string } | null;
}

interface Hearing {
  id: string;
  hearing_date: string;
  purpose: string;
  notes: string;
  outcome: string;
  is_completed: boolean;
}

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [relatedCounts, setRelatedCounts] = useState({ hearings: 0, documents: 0, time_entries: 0 });
  const [courtStatus, setCourtStatus] = useState<any[]>([]);
  const [courtOrders, setCourtOrders] = useState<any[]>([]);
  const [loadingCourt, setLoadingCourt] = useState(false);
  const [courtLinked, setCourtLinked] = useState(false);
  const [courtForm, setCourtForm] = useState({
    court_code: "",
    case_type: "",
    case_number: "",
    year: "",
  });
  const [caseTeam, setCaseTeam] = useState<any[]>([]);
  const [employees, setEmployees] = useState<{ id: string; full_name: string; role: string }[]>([]);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeamMember, setNewTeamMember] = useState({ employee_id: "", brought_by: "", profit_share_percentage: 0, is_lead: false, notes: "" });
  const [caseAlert, setCaseAlert] = useState<any>(null);
  const [alertLoading, setAlertLoading] = useState(false);
  const [caseLaws, setCaseLaws] = useState<any[]>([]);
  const [caseLawsLoading, setCaseLawsLoading] = useState(false);
  const [caseLawsSource, setCaseLawsSource] = useState<string>("");
  const [expandedLaw, setExpandedLaw] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchCase = async () => {
      const { data } = await supabase
        .from("cases")
        .select("*, client:clients(id, full_name, phone, email)")
        .eq("id", params.id)
        .single();

      if (data) {
        setCaseData(data as CaseDetail);
        const { data: hearingsData } = await supabase
          .from("hearings")
          .select("*")
          .eq("case_id", params.id)
          .order("hearing_date", { ascending: false });
        setHearings(hearingsData || []);

        const [hearingsCount, docsCount, timeCount] = await Promise.all([
          supabase.from("hearings").select("id", { count: "exact", head: true }).eq("case_id", params.id),
          supabase.from("documents").select("id", { count: "exact", head: true }).eq("case_id", params.id),
          supabase.from("time_entries").select("id", { count: "exact", head: true }).eq("case_id", params.id),
        ]);
        setRelatedCounts({
          hearings: hearingsCount.count || 0,
          documents: docsCount.count || 0,
          time_entries: timeCount.count || 0,
        });

        // Fetch case team
        const { data: teamData } = await supabase
          .from("case_team")
          .select("*, employee:profiles!case_team_employee_id_fkey(id, full_name, role)")
          .eq("case_id", params.id)
          .order("is_lead", { ascending: false });
        setCaseTeam(teamData || []);

        // Fetch employees for add form
        const { data: profile } = await supabase
          .from("profiles")
          .select("firm_id")
          .eq("id", data.created_by)
          .single();
        if (profile?.firm_id) {
          const { data: emps } = await supabase
            .from("profiles")
            .select("id, full_name, role")
            .eq("firm_id", profile.firm_id)
            .not("role", "eq", "owner");
          setEmployees(emps || []);
        }

        // Fetch case alert status
        const { data: alertData } = await supabase
          .from("case_alerts")
          .select("*")
          .eq("user_id", (await supabase.auth.getUser()).data.user?.id || "")
          .eq("case_id", params.id)
          .single();
        setCaseAlert(alertData);

        // Fetch case laws if acts or sections exist
        if ((data.acts && data.acts.length > 0) || (data.sections && data.sections.length > 0)) {
          setCaseLawsLoading(true);
          try {
            const res = await fetch(`/api/cases/${params.id}/similar`);
            const lawsData = await res.json();
            if (!lawsData.error) {
              setCaseLaws(lawsData.results || []);
              setCaseLawsSource(lawsData.source || "");
            }
          } catch {
            // Silently fail — case laws are non-critical
          }
          setCaseLawsLoading(false);
        }
      }
      setLoading(false);
    };

    fetchCase();
  }, [params.id, supabase]);

  const handleAddTeamMember = async () => {
    if (!newTeamMember.employee_id) {
      toast.error("Select an employee");
      return;
    }
    try {
      const res = await fetch("/api/cases/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: params.id,
          employee_id: newTeamMember.employee_id,
          brought_by: newTeamMember.brought_by || null,
          profit_share_percentage: newTeamMember.profit_share_percentage,
          is_lead: newTeamMember.is_lead,
          notes: newTeamMember.notes || null,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCaseTeam((prev) => [...prev, data]);
      setNewTeamMember({ employee_id: "", brought_by: "", profit_share_percentage: 0, is_lead: false, notes: "" });
      setShowAddTeam(false);
      toast.success("Team member added!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdateTeamMember = async (id: string, updates: any) => {
    try {
      const res = await fetch("/api/cases/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCaseTeam((prev) => prev.map((t) => t.id === id ? data : t));
      toast.success("Updated!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRemoveTeamMember = async (id: string) => {
    if (!confirm("Remove from case team?")) return;
    try {
      const res = await fetch(`/api/cases/team?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCaseTeam((prev) => prev.filter((t) => t.id !== id));
      toast.success("Removed from team!");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const now = new Date().toISOString();
    await supabase.from("hearings").update({ deleted_at: now }).eq("case_id", params.id);
    await supabase.from("time_entries").update({ deleted_at: now }).eq("case_id", params.id);
    await supabase.from("documents").update({ deleted_at: now }).eq("case_id", params.id);
    await supabase.from("invoices").update({ status: "cancelled" }).eq("case_id", params.id);
    const { error } = await supabase.from("cases").update({ deleted_at: now }).eq("id", params.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Case and all related records deleted");
    router.push("/cases");
  };

  const updateStatus = async (newStatus: string) => {
    const { error } = await supabase.from("cases").update({ status: newStatus }).eq("id", params.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCaseData((prev) => (prev ? { ...prev, status: newStatus } : null));
    toast.success("Status updated");
  };

  const fetchCourtStatus = async () => {
    if (!courtForm.court_code || !courtForm.case_type || !courtForm.case_number || !courtForm.year) {
      toast.error("Please fill all court fields");
      return;
    }
    setLoadingCourt(true);
    try {
      const params_str = new URLSearchParams({
        court_code: courtForm.court_code,
        case_type: courtForm.case_type,
        case_number: courtForm.case_number,
        year: courtForm.year,
      });
      const res = await fetch(`/api/courts/hc/case-status?${params_str}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCourtStatus(data);
      setCourtLinked(true);

      const ordersRes = await fetch(`/api/courts/hc/orders?${params_str}`);
      const ordersData = await ordersRes.json();
      if (!ordersData.error) setCourtOrders(ordersData);

      toast.success("Court data fetched successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch court data");
    }
    setLoadingCourt(false);
  };

  const downloadOrderPdf = async (pdfUrl: string) => {
    try {
      const res = await fetch(`/api/courts/download-pdf?pdf_url=${encodeURIComponent(pdfUrl)}`);
      const data = await res.json();
      if (data.pdf_base64) {
        const byteCharacters = atob(data.pdf_base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      }
    } catch (error: any) {
      toast.error("Failed to download PDF");
    }
  };

  const toggleCaseAlert = async () => {
    setAlertLoading(true);
    try {
      const res = await fetch("/api/case-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case_id: params.id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCaseAlert(data);
      toast.success(data.is_active ? "Alerts enabled" : "Alerts disabled");
    } catch (error: any) {
      toast.error(error.message || "Failed to toggle alert");
    }
    setAlertLoading(false);
  };

  if (loading) {
    return <div className="text-center py-12 text-[var(--text-secondary)]">Loading case details...</div>;
  }

  if (!caseData) {
    return <div className="text-center py-12 text-[var(--text-secondary)]">Case not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/cases">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{caseData.title}</h1>
            <Badge className={getStatusColor(caseData.status)}>{caseData.status}</Badge>
          </div>
          <p className="text-[var(--text-secondary)] text-sm">{caseData.case_number}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link href={`/cases/${caseData.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Case"
        message={`This will permanently delete this case and all related records (${relatedCounts.hearings} hearings, ${relatedCounts.documents} documents, ${relatedCounts.time_entries} time entries). This action cannot be undone.`}
        confirmLabel="Delete Case"
        loading={deleting}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Case Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[var(--text-secondary)]">Case Type</p>
                  <p className="font-medium">{caseData.case_type}</p>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)]">Court</p>
                  <p className="font-medium">{caseData.court || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)]">Judge</p>
                  <p className="font-medium">{caseData.judge_name || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)]">Filing Date</p>
                  <p className="font-medium">
                    {caseData.filing_date ? formatDate(caseData.filing_date) : "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)]">Opposing Party</p>
                  <p className="font-medium">{caseData.opposing_party || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)]">Opposing Counsel</p>
                  <p className="font-medium">{caseData.opposing_counsel || "Not specified"}</p>
                </div>
              </div>
              {caseData.description && (
                <div>
                  <p className="text-[var(--text-secondary)] text-sm mb-1">Description</p>
                  <p className="text-sm">{caseData.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {["pending", "active", "in-progress", "under-trial", "won", "lost", "settled", "closed"].map(
                  (status) => (
                    <Button
                      key={status}
                      variant={caseData.status === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateStatus(status)}
                    >
                      {status}
                    </Button>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Case Team */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Case Team ({caseTeam.length})
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowAddTeam(!showAddTeam)}>
                {showAddTeam ? "Cancel" : "+ Add Member"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddTeam && (
                <div className="p-4 bg-[var(--background)] rounded-lg space-y-3 border">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Counsel *</label>
                      <select
                        value={newTeamMember.employee_id}
                        onChange={(e) => setNewTeamMember({ ...newTeamMember, employee_id: e.target.value })}
                        className="w-full border rounded-md px-2 py-1.5 text-sm"
                      >
                        <option value="">Select...</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.role})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Brought By (Referral)</label>
                      <input
                        type="text"
                        value={newTeamMember.brought_by}
                        onChange={(e) => setNewTeamMember({ ...newTeamMember, brought_by: e.target.value })}
                        placeholder="Who brought this case?"
                        className="w-full border rounded-md px-2 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Profit Share %</label>
                      <input
                        type="number"
                        value={newTeamMember.profit_share_percentage || ""}
                        onChange={(e) => setNewTeamMember({ ...newTeamMember, profit_share_percentage: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                        min="0"
                        max="100"
                        className="w-full border rounded-md px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={newTeamMember.is_lead}
                          onChange={(e) => setNewTeamMember({ ...newTeamMember, is_lead: e.target.checked })}
                          className="rounded"
                        />
                        Lead Counsel
                      </label>
                    </div>
                  </div>
                  <Button size="sm" onClick={handleAddTeamMember}>Add to Team</Button>
                </div>
              )}

              {caseTeam.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] text-center py-4">No team members assigned yet.</p>
              ) : (
                <div className="space-y-3">
                  {caseTeam.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-[var(--surface-subtle)]">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[var(--surface-accent)] flex items-center justify-center">
                          <span className="text-sm font-medium text-[var(--text-accent)]">
                            {(member.employee?.full_name || "?")[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{member.employee?.full_name}</p>
                            {member.is_lead && <Badge variant="default" className="text-xs">Lead</Badge>}
                          </div>
                          <p className="text-xs text-[var(--text-secondary)]">
                            {member.employee?.role}
                            {member.brought_by && <> · Brought by: {member.brought_by}</>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-bold">{member.profit_share_percentage || 0}%</p>
                          <p className="text-xs text-[var(--text-secondary)]">profit share</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
  const input = window.prompt("New %:", member.profit_share_percentage);
  const val = parseInt(input || "", 10);
  if (input !== null && !isNaN(val) && val >= 0 && val <= 100) {
    handleUpdateTeamMember(member.id, { profit_share_percentage: val });
  }
}}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTeamMember(member.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Total profit share */}
                  <div className="flex items-center justify-between p-3 bg-[var(--surface-subtle)] rounded-lg border border-blue-200">
                    <span className="text-sm font-medium text-blue-800">Total Profit Share Allocated</span>
                    <span className="text-lg font-bold text-blue-900">
                      {caseTeam.reduce((sum, m) => sum + (m.profit_share_percentage || 0), 0)}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live Court Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Live Court Status
              </CardTitle>
              {courtLinked && (
                <Button variant="outline" size="sm" onClick={fetchCourtStatus} disabled={loadingCourt}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingCourt ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {!courtLinked ? (
                <>
                  <p className="text-sm text-[var(--text-secondary)]">Link this case to eCourts to fetch live status and orders.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={courtForm.court_code}
                      onChange={(e) => setCourtForm({ ...courtForm, court_code: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                    >
                      <option value="">Select Court</option>
                      <option value="delhi">Delhi High Court</option>
                      <option value="bombay">Bombay High Court</option>
                      <option value="calcutta">Calcutta High Court</option>
                      <option value="madras">Madras High Court</option>
                      <option value="karnataka">Karnataka High Court</option>
                      <option value="allahabad">Allahabad High Court</option>
                      <option value="patna">Patna High Court</option>
                      <option value="rajasthan">Rajasthan High Court</option>
                      <option value="gujarat">Gujarat High Court</option>
                      <option value="andhra">Andhra Pradesh High Court</option>
                      <option value="telangana">Telangana High Court</option>
                      <option value="kerala">Kerala High Court</option>
                      <option value="punjab">Punjab & Haryana High Court</option>
                      <option value="mp">Madhya Pradesh High Court</option>
                      <option value="jharkhand">Jharkhand High Court</option>
                    </select>
                    <Input
                      placeholder="Case Type Code (e.g. 134)"
                      value={courtForm.case_type}
                      onChange={(e) => setCourtForm({ ...courtForm, case_type: e.target.value })}
                    />
                    <Input
                      placeholder="Case Number"
                      value={courtForm.case_number}
                      onChange={(e) => setCourtForm({ ...courtForm, case_number: e.target.value })}
                    />
                    <Input
                      placeholder="Year"
                      value={courtForm.year}
                      onChange={(e) => setCourtForm({ ...courtForm, year: e.target.value })}
                    />
                  </div>
                  <Button onClick={fetchCourtStatus} disabled={loadingCourt} className="w-full">
                    <Search className="h-4 w-4 mr-2" />
                    {loadingCourt ? "Fetching..." : "Fetch Live Status"}
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  {courtStatus.length > 0 ? (
                    courtStatus.map((c: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg border bg-[var(--background)]">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-[var(--text-secondary)]">CNR:</span>
                            <span className="ml-2 font-medium">{c.cnr_number || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-[var(--text-secondary)]">Type:</span>
                            <span className="ml-2 font-medium">{c.case_type}</span>
                          </div>
                          <div>
                            <span className="text-[var(--text-secondary)]">Petitioner:</span>
                            <span className="ml-2">{c.petitioner}</span>
                          </div>
                          <div>
                            <span className="text-[var(--text-secondary)]">Respondent:</span>
                            <span className="ml-2">{c.respondent}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--text-secondary)]">No court records found.</p>
                  )}

                  {courtOrders.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Recent Orders</h4>
                      <div className="space-y-2">
                        {courtOrders.map((o: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded border text-sm">
                            <div>
                              <span className="font-medium">{o.order_date}</span>
                              <span className="ml-2 text-[var(--text-secondary)]">{o.order_type}</span>
                              {o.judge && <span className="ml-2 text-[var(--text-tertiary)]">- {o.judge}</span>}
                            </div>
                            {o.pdf_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadOrderPdf(o.pdf_url)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCourtLinked(false);
                      setCourtStatus([]);
                      setCourtOrders([]);
                    }}
                    className="w-full"
                  >
                    Unlink Court
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Case Status Alerts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Status Alerts
              </CardTitle>
              <Button
                variant={caseAlert?.is_active ? "default" : "outline"}
                size="sm"
                onClick={toggleCaseAlert}
                disabled={alertLoading}
                className={caseAlert?.is_active ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {alertLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : caseAlert?.is_active ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Alerts On
                  </>
                ) : (
                  <>
                    <BellOff className="h-4 w-4 mr-1" />
                    Enable Alerts
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {caseAlert?.is_active ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                    <CheckCircle className="h-4 w-4" />
                    <span>Monitoring for status changes. You&apos;ll be notified via WhatsApp, Email, and in-app.</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-[var(--text-secondary)]">
                    <div className="p-2 bg-[var(--background)] rounded">
                      <span className="block font-medium text-[var(--text-primary)]">Last Status</span>
                      {caseAlert.last_known_status || "Pending"}
                    </div>
                    <div className="p-2 bg-[var(--background)] rounded">
                      <span className="block font-medium text-[var(--text-primary)]">Last Hearing</span>
                      {caseAlert.last_known_hearing_date || "N/A"}
                    </div>
                    <div className="p-2 bg-[var(--background)] rounded">
                      <span className="block font-medium text-[var(--text-primary)]">Last Checked</span>
                      {caseAlert.last_checked_at ? new Date(caseAlert.last_checked_at).toLocaleString() : "Never"}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">
                  Enable alerts to get notified when the court status, hearing date, or case stage changes.
                  Notifications are sent via Email, WhatsApp, and in-app alerts.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Hearings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Hearings</CardTitle>
              <Link href={`/calendar?case_id=${caseData.id}`}>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {hearings.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-center py-4">No hearings recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {hearings.map((h) => (
                    <div key={h.id} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{formatDate(h.hearing_date)}</p>
                        <Badge variant={h.is_completed ? "success" : "warning"}>
                          {h.is_completed ? "Completed" : "Upcoming"}
                        </Badge>
                      </div>
                      {h.purpose && <p className="text-sm text-[var(--text-secondary)] mt-1">{h.purpose}</p>}
                      {h.outcome && (
                        <p className="text-sm mt-1">
                          <span className="font-medium">Outcome:</span> {h.outcome}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Relevant Case Laws */}
          {(caseData.acts?.length || 0) + (caseData.sections?.length || 0) > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Relevant Case Laws
                </CardTitle>
                <div className="flex items-center gap-2">
                  {caseLawsSource === "cache" && (
                    <span className="text-xs text-[var(--text-tertiary)]">Cached</span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setCaseLawsLoading(true);
                      try {
                        const res = await fetch(`/api/cases/${params.id}/similar?refresh=true`);
                        const data = await res.json();
                        if (!data.error) {
                          setCaseLaws(data.results || []);
                          setCaseLawsSource(data.source || "");
                          toast.success(`Found ${data.results?.length || 0} relevant cases`);
                        }
                      } catch {
                        toast.error("Failed to fetch case laws");
                      }
                      setCaseLawsLoading(false);
                    }}
                    disabled={caseLawsLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${caseLawsLoading ? "animate-spin" : ""}`} />
                    {caseLawsLoading ? "Searching..." : "Refresh"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Acts & Sections tags */}
                <div className="flex flex-wrap gap-2">
                  {(caseData.acts || []).map((act) => (
                    <span key={act} className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                      {act}
                    </span>
                  ))}
                  {(caseData.sections || []).map((s) => (
                    <span key={s} className="px-2 py-0.5 bg-[var(--surface-accent)] text-blue-800 rounded text-xs font-medium">
                      S. {s}
                    </span>
                  ))}
                  {(caseData.clauses || []).map((c, i) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-100 text-[var(--text-secondary)] rounded text-xs">
                      {c}
                    </span>
                  ))}
                </div>

                {caseLawsLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-500 mb-2" />
                    <p className="text-sm text-[var(--text-secondary)]">Searching Indian Kanoon for relevant judgments...</p>
                  </div>
                ) : caseLaws.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)] text-center py-4">
                    No relevant case laws found. Click &quot;Refresh&quot; to search.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {caseLaws.map((law, i) => (
                      <div
                        key={i}
                        className="border rounded-lg overflow-hidden hover:border-blue-300 transition-colors"
                      >
                        <button
                          type="button"
                          className="w-full text-left p-3 flex items-start justify-between gap-2"
                          onClick={() => setExpandedLaw(expandedLaw === i ? null : i)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs shrink-0">
                                {law.court}
                              </Badge>
                              <span className="text-xs text-[var(--text-tertiary)] shrink-0">
                                {Math.round(law.relevance_score * 100)}% match
                              </span>
                            </div>
                            <p className="font-medium text-sm line-clamp-2">{law.title}</p>
                            {law.citation && (
                              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{law.citation}</p>
                            )}
                          </div>
                          {expandedLaw === i ? (
                            <ChevronUp className="h-4 w-4 text-[var(--text-tertiary)] mt-1 shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)] mt-1 shrink-0" />
                          )}
                        </button>

                        {expandedLaw === i && (
                          <div className="px-3 pb-3 border-t bg-[var(--background)] space-y-2">
                            {law.excerpt && (
                              <p className="text-sm text-[var(--text-secondary)] mt-2 line-clamp-4">{law.excerpt}</p>
                            )}
                            <div className="flex flex-wrap gap-4 text-xs text-[var(--text-secondary)]">
                              {law.judgment_date && <span>Date: {law.judgment_date}</span>}
                              {law.judges?.length > 0 && <span>Bench: {law.judges.join(", ")}</span>}
                            </div>
                            {law.matched_sections?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {law.matched_sections.map((s: string) => (
                                  <span key={s} className="px-1.5 py-0.5 bg-[var(--surface-accent)] text-blue-700 rounded text-xs">
                                    S. {s}
                                  </span>
                                ))}
                              </div>
                            )}
                            {law.url && (
                              <a
                                href={law.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-[var(--text-accent)] hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View on Indian Kanoon
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Total Fee</span>
                <span className="font-medium">{formatCurrency(caseData.total_fee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Received</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(caseData.amount_received)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-[var(--text-secondary)]">Pending</span>
                <span className="font-medium text-red-600">
                  {formatCurrency(caseData.total_fee - caseData.amount_received)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Client Info */}
          {caseData.client && (
            <Card>
              <CardHeader>
                <CardTitle>Client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[var(--text-tertiary)]" />
                  <Link
                    href={`/clients/${caseData.client.id}`}
                    className="font-medium hover:underline"
                  >
                    {caseData.client.full_name}
                  </Link>
                </div>
                {caseData.client.phone && (
                  <p className="text-sm text-[var(--text-secondary)]">Phone: {caseData.client.phone}</p>
                )}
                {caseData.client.email && (
                  <p className="text-sm text-[var(--text-secondary)]">Email: {caseData.client.email}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Next Hearing */}
          {caseData.next_hearing_date && (
            <Card>
              <CardHeader>
                <CardTitle>Next Hearing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-[var(--surface-subtle)] flex flex-col items-center justify-center">
                    <span className="text-xs font-medium text-[var(--text-accent)]">
                      {new Date(caseData.next_hearing_date).toLocaleDateString("en-IN", { month: "short" })}
                    </span>
                    <span className="text-xl font-bold text-blue-700">
                      {new Date(caseData.next_hearing_date).getDate()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{formatDate(caseData.next_hearing_date)}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{caseData.court}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
