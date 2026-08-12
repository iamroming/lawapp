"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Download,
  Scale,
  FileText,
  Calendar,
  User,
  Building2,
  Loader2,
  BookOpen,
  MapPin,
  RefreshCw,
} from "lucide-react";

interface SCJudgment {
  title: string;
  case_number: string;
  judgment_date: string;
  source_id: string;
  pdf_url: string;
}

interface HCResult {
  case_number: string;
  case_type: string;
  cnr_number: string;
  petitioner: string;
  respondent: string;
  court_name: string;
  status: string;
}

interface HCCauseListPDF {
  serial_number: number;
  bench: string;
  cause_list_type: string;
  pdf_url: string;
}

interface DCResult {
  case_number: string;
  case_type: string;
  cnr_number: string;
  petitioner: string;
  respondent: string;
  court_name: string;
}

interface DCState {
  state_code: string;
  state_name: string;
}

interface DCDistrict {
  district_code: string;
  district_name: string;
}

interface DCCourtComplex {
  court_complex_code: string;
  court_complex_name: string;
}

const HIGH_COURTS = [
  { code: "delhi", name: "Delhi High Court" },
  { code: "bombay", name: "Bombay High Court" },
  { code: "calcutta", name: "Calcutta High Court" },
  { code: "madras", name: "Madras High Court" },
  { code: "karnataka", name: "Karnataka High Court" },
  { code: "allahabad", name: "Allahabad High Court" },
  { code: "patna", name: "Patna High Court" },
  { code: "rajasthan", name: "Rajasthan High Court" },
  { code: "gujarat", name: "Gujarat High Court" },
  { code: "andhra", name: "Andhra Pradesh HC" },
  { code: "telangana", name: "Telangana HC" },
  { code: "kerala", name: "Kerala High Court" },
  { code: "punjab", name: "Punjab & Haryana HC" },
  { code: "mp", name: "Madhya Pradesh HC" },
  { code: "jharkhand", name: "Jharkhand High Court" },
];

const STATES = [
  { code: "28", name: "Andaman and Nicobar" },
  { code: "2", name: "Andhra Pradesh" },
  { code: "36", name: "Arunachal Pradesh" },
  { code: "6", name: "Assam" },
  { code: "8", name: "Bihar" },
  { code: "32", name: "Chandigarh" },
  { code: "18", name: "Chhattisgarh" },
  { code: "7", name: "Delhi" },
  { code: "37", name: "Goa" },
  { code: "17", name: "Gujarat" },
  { code: "10", name: "Haryana" },
  { code: "5", name: "Himachal Pradesh" },
  { code: "12", name: "Jammu and Kashmir" },
  { code: "33", name: "Jharkhand" },
  { code: "3", name: "Karnataka" },
  { code: "4", name: "Kerala" },
  { code: "38", name: "Ladakh" },
  { code: "35", name: "Lakshadweep" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "27", name: "Maharashtra" },
  { code: "25", name: "Manipur" },
  { code: "21", name: "Meghalaya" },
  { code: "34", name: "Mizoram" },
  { code: "39", name: "Nagaland" },
  { code: "11", name: "Odisha" },
  { code: "31", name: "Puducherry" },
  { code: "22", name: "Punjab" },
  { code: "9", name: "Rajasthan" },
  { code: "24", name: "Sikkim" },
  { code: "30", name: "Tamil Nadu" },
  { code: "29", name: "Telangana" },
  { code: "40", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "20", name: "Tripura" },
  { code: "13", name: "Uttar Pradesh" },
  { code: "15", name: "Uttarakhand" },
  { code: "16", name: "West Bengal" },
];

export default function ResearchPage() {
  const [activeTab, setActiveTab] = useState<"sci" | "hc" | "dc">("sci");

  // SCI State
  const [sciResults, setSciResults] = useState<SCJudgment[]>([]);

  // HC State
  const [hcCourt, setHcCourt] = useState("delhi");
  const [hcCauseDate, setHcCauseDate] = useState(new Date().toISOString().split("T")[0]);
  const [hcParty, setHcParty] = useState("");
  const [hcYear, setHcYear] = useState("");
  const [hcResults, setHcResults] = useState<HCResult[]>([]);
  const [hcCauseList, setHcCauseList] = useState<HCCauseListPDF[]>([]);
  const [hcLandmarkJudgments, setHcLandmarkJudgments] = useState<{title: string; court: string; date: string; citation?: string; pdf_url?: string}[]>([]);
  const [loadingCauseList, setLoadingCauseList] = useState(false);

  // DC State
  const [dcState, setDcState] = useState("");
  const dcStateRef = useRef(dcState);
  dcStateRef.current = dcState;
  const [dcDistrict, setDcDistrict] = useState("");
  const [dcCourtComplex, setDcCourtComplex] = useState("");
  const [dcDistricts, setDcDistricts] = useState<DCDistrict[]>([]);
  const [dcCourtComplexes, setDcCourtComplexes] = useState<DCCourtComplex[]>([]);
  const [dcParty, setDcParty] = useState("");
  const [dcYear, setDcYear] = useState("");
  const [dcResults, setDcResults] = useState<DCResult[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingComplexes, setLoadingComplexes] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch SCI recent
  const fetchSCRecent = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/courts/sc/recent?limit=20");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSciResults(data);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  // Fetch HC cause list when court or date changes
  const fetchHCCauseList = useCallback(async (courtCode: string, date: string) => {
    setLoadingCauseList(true);
    setError("");
    setHcCauseList([]);
    setHcLandmarkJudgments([]);
    try {
      const params = new URLSearchParams({ court_code: courtCode, civil: "true", causelist_date: date });
      const res = await fetch(`/api/courts/hc/cause-list?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const list = Array.isArray(data) ? data : [];
      setHcCauseList(list);

      // If no cause list, fetch recent HC judgments as landmark fallback
      if (list.length === 0) {
        try {
          const jParams = new URLSearchParams({ court_code: courtCode, page_size: "10" });
          const jRes = await fetch(`/api/courts/hc/recent-judgments?${jParams}`);
          const jData = await jRes.json();
          if (jData.results) setHcLandmarkJudgments(jData.results);
        } catch {
          // HC judgments API may not exist, silently ignore
        }
      }
    } catch (e: any) {
      // Court service may be unavailable, show empty state
    }
    setLoadingCauseList(false);
  }, []);

  // Fetch HC cause list when court or date changes
  useEffect(() => {
    if (activeTab === "hc") {
      fetchHCCauseList(hcCourt, hcCauseDate);
    }
  }, [activeTab, hcCourt, hcCauseDate, fetchHCCauseList]);

  // Fetch DC districts when state changes
  useEffect(() => {
    if (activeTab === "dc" && dcState) {
      setLoadingDistricts(true);
      setDcDistrict("");
      setDcCourtComplex("");
      setDcDistricts([]);
      setDcCourtComplexes([]);
      setDcResults([]);

      fetch(`/api/courts/dc/districts?state_code=${dcState}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) setDcDistricts(Array.isArray(data) ? data : []);
        })
        .catch(() => {})
        .finally(() => setLoadingDistricts(false));
    }
  }, [activeTab, dcState]);

  // Fetch DC court complexes when district changes
  useEffect(() => {
    if (dcDistrict && dcStateRef.current) {
      setLoadingComplexes(true);
      setDcCourtComplex("");
      setDcCourtComplexes([]);

      fetch(`/api/courts/dc/court-complexes?district_code=${dcDistrict}&state_code=${dcStateRef.current}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) setDcCourtComplexes(Array.isArray(data) ? data : []);
        })
        .catch(() => {})
        .finally(() => setLoadingComplexes(false));
    }
  }, [dcDistrict]);

  const searchHC = async () => {
    if (!hcParty && !hcYear) {
      setError("Enter party name or year to search");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        court_code: hcCourt,
        party_name: hcParty,
        year: hcYear || new Date().getFullYear().toString(),
        status_filter: "Both",
      });
      const res = await fetch(`/api/courts/hc/case-by-party?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setHcResults(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const searchDC = async () => {
    if (!dcParty) {
      setError("Enter party name to search");
      return;
    }
    if (!dcCourtComplex) {
      setError("Select a court complex first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        state_code: dcState,
        district_code: dcDistrict,
        court_complex_code: dcCourtComplex,
        party_name: dcParty,
        year: dcYear || new Date().getFullYear().toString(),
      });
      const res = await fetch(`/api/courts/dc/case-by-party?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDcResults(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const downloadPdf = async (pdfUrl: string, filename: string) => {
    try {
      const res = await fetch(`/api/courts/download-pdf?pdf_url=${encodeURIComponent(pdfUrl)}`);
      const data = await res.json();
      if (data.pdf_base64) {
        const byteCharacters = atob(data.pdf_base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([new Uint8Array(byteNumbers)], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "sci" && sciResults.length === 0) fetchSCRecent();
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Scale className="h-6 w-6" />
          Court Research
        </h1>
        <p className="text-[var(--text-secondary)]">Search judgments, cause lists, and case data across Indian courts</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-2">
        <Button variant={activeTab === "sci" ? "default" : "ghost"} onClick={() => setActiveTab("sci")}>
          <Building2 className="h-4 w-4 mr-2" />
          Supreme Court
        </Button>
        <Button variant={activeTab === "hc" ? "default" : "ghost"} onClick={() => setActiveTab("hc")}>
          <Scale className="h-4 w-4 mr-2" />
          High Courts
        </Button>
        <Button variant={activeTab === "dc" ? "default" : "ghost"} onClick={() => setActiveTab("dc")}>
          <MapPin className="h-4 w-4 mr-2" />
          District Courts
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* SUPREME COURT TAB */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === "sci" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Supreme Court - Latest Judgments</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchSCRecent} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--text-accent)]" />
              </div>
            ) : sciResults.length === 0 ? (
              <p className="text-center text-[var(--text-secondary)] py-8">No recent judgments available</p>
            ) : (
              <div className="space-y-3">
                {sciResults.map((j, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border hover:bg-[var(--surface-subtle)]">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{j.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-secondary)]">
                        <span>{j.case_number}</span>
                        {j.judgment_date && <span>{j.judgment_date}</span>}
                      </div>
                    </div>
                    {j.pdf_url && (
                      <Button variant="ghost" size="sm" onClick={() => downloadPdf(j.pdf_url, `SCI_${j.source_id}.pdf`)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* HIGH COURTS TAB */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === "hc" && (
        <div className="space-y-6">
          {/* Court Selector + Latest Cause List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>High Court - Cause List</CardTitle>
              <Button variant="outline" size="sm" onClick={() => fetchHCCauseList(hcCourt, hcCauseDate)} disabled={loadingCauseList}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingCauseList ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={hcCourt}
                  onChange={(e) => setHcCourt(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm min-w-[250px]"
                >
                  {HIGH_COURTS.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[var(--text-secondary)]" />
                  <input
                    type="date"
                    value={hcCauseDate}
                    onChange={(e) => setHcCauseDate(e.target.value)}
                    className="border rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <Badge variant="secondary">
                  {HIGH_COURTS.find((c) => c.code === hcCourt)?.name}
                </Badge>
              </div>

              {loadingCauseList ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[var(--text-accent)]" />
                </div>
              ) : hcCauseList.length === 0 ? (
                <div>
                  <p className="text-center text-[var(--text-secondary)] py-4">No cause list available for {hcCauseDate}.</p>
                  {hcLandmarkJudgments.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Recent Judgments — {HIGH_COURTS.find(c => c.code === hcCourt)?.name}</h4>
                      {hcLandmarkJudgments.map((j, i) => (
                        <div key={i} className="flex items-start justify-between p-3 border-b last:border-0">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800 text-sm">{j.title}</p>
                            <p className="text-xs text-[var(--text-secondary)] mt-1">{j.court} — {j.date}</p>
                          </div>
                          <div className="flex gap-2">
                            {j.pdf_url && (
                              <Button variant="outline" size="sm" onClick={() => window.open(j.pdf_url, "_blank")}>
                                <FileText className="h-4 w-4 mr-1" /> PDF
                              </Button>
                            )}
                            {j.citation && <Badge variant="outline" className="text-xs">{j.citation}</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 space-y-2">
                      <p className="text-sm text-[var(--text-secondary)]">No cause list or recent orders available for {hcCauseDate}.</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Badge variant="outline" className="text-xs cursor-pointer" onClick={() => {
                          const d = new Date(hcCauseDate);
                          d.setDate(d.getDate() - 1);
                          setHcCauseDate(d.toISOString().split("T")[0]);
                        }}>Try Previous Day</Badge>
                        <Badge variant="outline" className="text-xs">Search by Party Name above</Badge>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-[var(--text-secondary)]">{hcCauseList.length} cause list PDFs available</p>
                  <div className="space-y-2">
                    {hcCauseList.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-lg border hover:bg-[var(--surface-subtle)]">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{item.cause_list_type}</Badge>
                            <span className="text-xs text-[var(--text-secondary)]">#{item.serial_number}</span>
                          </div>
                          <p className="text-sm text-[var(--text-primary)] mt-1">{item.bench}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.pdf_url && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(item.pdf_url, "_blank")}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadPdf(item.pdf_url, `HC_CauseList_${item.cause_list_type.replace(/\s/g, "_")}.pdf`)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Party Search */}
          <Card>
            <CardHeader>
              <CardTitle>High Court - Party Search</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={hcCourt}
                  onChange={(e) => setHcCourt(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm"
                >
                  {HIGH_COURTS.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
                <Input
                  placeholder="Party name (e.g. 'Tata Motors')"
                  value={hcParty}
                  onChange={(e) => setHcParty(e.target.value)}
                />
                <Input
                  placeholder="Year (e.g. 2024)"
                  value={hcYear}
                  onChange={(e) => setHcYear(e.target.value)}
                  type="number"
                />
              </div>
              <Button onClick={searchHC} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                Search High Court Cases
              </Button>

              {hcResults.length > 0 && (
                <div className="space-y-3 mt-4">
                  <p className="text-sm text-[var(--text-secondary)]">{hcResults.length} cases found</p>
                  {hcResults.map((c, i) => (
                    <div key={i} className="p-4 rounded-lg border hover:bg-[var(--surface-subtle)]">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{c.case_type} {c.case_number}</p>
                          <p className="text-sm text-[var(--text-secondary)] mt-1">{c.petitioner} vs {c.respondent}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-secondary)]">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {c.court_name || HIGH_COURTS.find(hc => hc.code === hcCourt)?.name}
                            </span>
                            {c.cnr_number && <span className="bg-gray-100 px-2 py-0.5 rounded">{c.cnr_number}</span>}
                            {c.status && <Badge variant="outline">{c.status}</Badge>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && hcResults.length === 0 && hcParty && (
                <p className="text-center text-[var(--text-secondary)] py-4">No cases found. Try a different search.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* DISTRICT COURTS TAB */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === "dc" && (
        <Card>
          <CardHeader>
            <CardTitle>District Court - Case Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* State → District → Court Complex */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">State *</label>
                <select
                  value={dcState}
                  onChange={(e) => setDcState(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Select State...</option>
                  {STATES.map((s) => (
                    <option key={s.code} value={s.code}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">District *</label>
                <select
                  value={dcDistrict}
                  onChange={(e) => setDcDistrict(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  disabled={!dcState || loadingDistricts}
                >
                  <option value="">
                    {loadingDistricts ? "Loading..." : !dcState ? "Select state first" : "Select District..."}
                  </option>
                  {dcDistricts.map((d) => (
                    <option key={d.district_code} value={d.district_code}>{d.district_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">Court Complex *</label>
                <select
                  value={dcCourtComplex}
                  onChange={(e) => setDcCourtComplex(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  disabled={!dcDistrict || loadingComplexes}
                >
                  <option value="">
                    {loadingComplexes ? "Loading..." : !dcDistrict ? "Select district first" : "Select Court Complex..."}
                  </option>
                  {dcCourtComplexes.map((c) => (
                    <option key={c.court_complex_code} value={c.court_complex_code}>{c.court_complex_name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Party search */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Party name (e.g. 'Rajesh Kumar')"
                value={dcParty}
                onChange={(e) => setDcParty(e.target.value)}
              />
              <Input
                placeholder="Year (e.g. 2024)"
                value={dcYear}
                onChange={(e) => setDcYear(e.target.value)}
                type="number"
              />
            </div>

            <Button onClick={searchDC} disabled={loading || !dcCourtComplex}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              Search District Court Cases
            </Button>

            {dcResults.length > 0 && (
              <div className="space-y-3 mt-4">
                <p className="text-sm text-[var(--text-secondary)]">{dcResults.length} cases found</p>
                {dcResults.map((c, i) => (
                  <div key={i} className="p-4 rounded-lg border hover:bg-[var(--surface-subtle)]">
                    <p className="font-medium">{c.case_type} {c.case_number}</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{c.petitioner} vs {c.respondent}</p>
                    {c.cnr_number && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded mt-2 inline-block">{c.cnr_number}</span>}
                  </div>
                ))}
              </div>
            )}

            {!loading && dcResults.length === 0 && dcParty && dcCourtComplex && (
              <p className="text-center text-[var(--text-secondary)] py-4">No cases found. Try a different search.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
