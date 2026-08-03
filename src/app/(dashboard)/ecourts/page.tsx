"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, getStatusColor } from "@/lib/utils";
import {
  Globe,
  RefreshCw,
  Plus,
  Search,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  MapPin,
  Calendar,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

interface ECourtsCase {
  id: string;
  cnr_number: string;
  court_name: string;
  court_type: string;
  state: string | null;
  district: string | null;
  last_synced_at: string | null;
  last_status: string | null;
  next_hearing_date: string | null;
  case_stage: string | null;
  judge_name: string | null;
  listing_bench: string | null;
  is_active: boolean;
  case: {
    id: string;
    case_number: string;
    title: string;
    status: string;
  } | null;
}

export default function ECourtsPage() {
  const [cases, setCases] = useState<ECourtsCase[]>([]);
  const [allCases, setAllCases] = useState<{ id: string; case_number: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCourt, setFilterCourt] = useState("all");
  const supabase = createClient();

  const [newCase, setNewCase] = useState({
    case_id: "",
    cnr_number: "",
    court_name: "",
    court_type: "district",
    state: "",
    district: "",
  });

  useEffect(() => {
    fetchECourtsCases();
    fetchAllCases();
  }, []);

  const fetchAllCases = async () => {
    const { data } = await supabase
      .from("cases")
      .select("id, case_number, title")
      .order("case_number");
    setAllCases((data || []) as { id: string; case_number: string; title: string }[]);
  };

  const fetchECourtsCases = async () => {
    try {
      const { data, error } = await supabase
        .from("ecourts_cases")
        .select("*, case:cases(id, case_number, title, status)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCases((data || []) as ECourtsCase[]);
    } catch (error) {
      console.error("Error fetching eCourts cases:", error);
      toast.error("Failed to fetch eCourts cases");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/ecourts/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      const synced = result.data?.filter((r: { status: string }) => r.status === "synced").length || 0;
      const errors = result.data?.filter((r: { status: string }) => r.status === "error").length || 0;

      toast.success(`Synced ${synced} cases${errors > 0 ? `, ${errors} errors` : ""}`);
      fetchECourtsCases();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleAddCase = async () => {
    if (!newCase.cnr_number || !newCase.court_name) {
      toast.error("CNR number and court name are required");
      return;
    }

    try {
      const response = await fetch("/api/ecourts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCase),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error);
      }

      toast.success("Case added for tracking");
      setShowAddModal(false);
      setNewCase({ case_id: "", cnr_number: "", court_name: "", court_type: "district", state: "", district: "" });
      fetchECourtsCases();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add case");
    }
  };

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.cnr_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.court_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.case?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.case?.case_number?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCourt = filterCourt === "all" || c.court_type === filterCourt;

    return matchesSearch && matchesCourt;
  });

  const getCourtTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      district: "District Court",
      high_court: "High Court",
      supreme: "Supreme Court",
      tribunal: "Tribunal",
    };
    return labels[type] || type;
  };

  const getCourtTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      district: "bg-[var(--surface-accent)] text-blue-800",
      high_court: "bg-purple-100 text-purple-800",
      supreme: "bg-red-100 text-red-800",
      tribunal: "bg-green-100 text-green-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const getSyncStatus = (lastSyncedAt: string | null) => {
    if (!lastSyncedAt) return { label: "Never synced", color: "text-[var(--text-secondary)]", icon: AlertCircle };
    const lastSync = new Date(lastSyncedAt);
    const now = new Date();
    const hoursSince = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60 * 60));

    if (hoursSince < 1) return { label: "Just synced", color: "text-green-600", icon: CheckCircle };
    if (hoursSince < 6) return { label: `${hoursSince}h ago`, color: "text-yellow-600", icon: Clock };
    return { label: `${hoursSince}h ago`, color: "text-red-600", icon: AlertCircle };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-accent)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6 text-[var(--text-accent)]" />
            eCourts Tracking
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">Track your cases across Indian courts in real-time</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSyncAll} disabled={syncing} variant="outline" className="text-sm">
            {syncing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync All
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="text-sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Case
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Total Tracked</p>
                <p className="text-2xl font-bold">{cases.length}</p>
              </div>
              <Globe className="h-8 w-8 text-[var(--text-accent)]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">District Courts</p>
                <p className="text-2xl font-bold">{cases.filter((c) => c.court_type === "district").length}</p>
              </div>
              <MapPin className="h-8 w-8 text-[var(--text-accent)]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">High Courts</p>
                <p className="text-2xl font-bold">{cases.filter((c) => c.court_type === "high_court").length}</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Need Sync</p>
                <p className="text-2xl font-bold">
                  {cases.filter((c) => {
                    if (!c.last_synced_at) return true;
                    const hours = Math.floor(
                      (Date.now() - new Date(c.last_synced_at).getTime()) / (1000 * 60 * 60)
                    );
                    return hours > 6;
                  }).length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
              <Input
                placeholder="Search by CNR, court, case number, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterCourt}
              onChange={(e) => setFilterCourt(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">All Courts</option>
              <option value="district">District Courts</option>
              <option value="high_court">High Courts</option>
              <option value="supreme">Supreme Court</option>
              <option value="tribunal">Tribunals</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Cases List */}
      {filteredCases.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No cases tracked yet</h3>
            <p className="text-[var(--text-secondary)] mb-4">Add your first case to start tracking it across Indian courts</p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Case
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCases.map((ec) => {
            const syncStatus = getSyncStatus(ec.last_synced_at);
            const SyncIcon = syncStatus.icon;

            return (
              <Card key={ec.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm truncate">{ec.case?.title || "Untitled"}</h3>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{ec.case?.case_number}</p>
                    </div>
                    <Badge className={getCourtTypeColor(ec.court_type)}>
                      {getCourtTypeLabel(ec.court_type)}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <Globe className="h-4 w-4" />
                      <span className="font-mono text-xs">{ec.cnr_number}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{ec.court_name}</span>
                    </div>
                    {ec.judge_name && (
                      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <User className="h-4 w-4" />
                        <span className="truncate">{ec.judge_name}</span>
                      </div>
                    )}
                    {ec.next_hearing_date && (
                      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <Calendar className="h-4 w-4" />
                        <span>Next: {new Date(ec.next_hearing_date).toLocaleDateString("en-IN")}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    <div className={`flex items-center gap-1 text-xs ${syncStatus.color}`}>
                      <SyncIcon className="h-3 w-3" />
                      {syncStatus.label}
                    </div>
                    <div className="flex gap-1">
                      <a
                        href={`https://ecourtsindia.com/case-status/${ec.cnr_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <ExternalLink className="h-4 w-4 text-[var(--text-secondary)]" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Case Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Case for Tracking"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">CNR Number *</label>
            <Input
              placeholder="16-digit CNR number"
              value={newCase.cnr_number}
              onChange={(e) => setNewCase({ ...newCase, cnr_number: e.target.value })}
              maxLength={16}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Court Name *</label>
            <Input
              placeholder="e.g., Delhi High Court"
              value={newCase.court_name}
              onChange={(e) => setNewCase({ ...newCase, court_name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Court Type</label>
              <select
                value={newCase.court_type}
                onChange={(e) => setNewCase({ ...newCase, court_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="district">District Court</option>
                <option value="high_court">High Court</option>
                <option value="supreme">Supreme Court</option>
                <option value="tribunal">Tribunal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">State</label>
              <Input
                placeholder="e.g., Delhi"
                value={newCase.state}
                onChange={(e) => setNewCase({ ...newCase, state: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Link to Existing Case (optional)</label>
            <select
              value={newCase.case_id}
              onChange={(e) => setNewCase({ ...newCase, case_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="">Select a case...</option>
              {allCases.map((c) => (
                <option key={c.id} value={c.id}>{c.case_number} — {c.title}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCase}>Add Case</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
