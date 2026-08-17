"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Mail,
  MessageSquare,
  Bell,
  Database,
  Play,
  Pause,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
  Settings,
  X,
  AlertTriangle,
} from "lucide-react";

interface CronJob {
  id: string;
  name: string;
  slug: string;
  description: string;
  endpoint: string;
  schedule_cron: string;
  is_enabled: boolean;
  last_run_at: string | null;
  last_status: string | null;
  last_error: string | null;
  last_duration_ms: number | null;
  total_runs: number;
  total_successes: number;
  total_failures: number;
  actions: {
    email: boolean;
    whatsapp: boolean;
    in_app: boolean;
    database: boolean;
  };
}

const ACTION_ICONS: Record<string, any> = {
  email: Mail,
  whatsapp: MessageSquare,
  in_app: Bell,
  database: Database,
};

const ACTION_COLORS: Record<string, string> = {
  email: "bg-blue-100 text-blue-700",
  whatsapp: "bg-green-100 text-green-700",
  in_app: "bg-purple-100 text-purple-700",
  database: "bg-amber-100 text-amber-700",
};

const SCHEDULE_PRESETS = [
  { label: "Every Hour", value: "0 * * * *" },
  { label: "Every 6 Hours", value: "0 */6 * * *" },
  { label: "Every 12 Hours", value: "0 */12 * * *" },
  { label: "Daily 6 AM", value: "0 6 * * *" },
  { label: "Daily 9 AM", value: "0 9 * * *" },
  { label: "Daily 12 PM", value: "0 12 * * *" },
  { label: "Daily 6 PM", value: "0 18 * * *" },
  { label: "Weekly Monday", value: "0 9 * * 1" },
];

export default function CronJobsPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<CronJob | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newJob, setNewJob] = useState({
    name: "",
    slug: "",
    description: "",
    endpoint: "",
    schedule_cron: "0 9 * * *",
    actions: { email: false, whatsapp: false, in_app: false, database: false },
  });

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/cron-jobs");
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error("Failed to fetch cron jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleToggle = async (job: CronJob) => {
    setSaving(job.id);
    try {
      await fetch("/api/super-admin/cron-jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: job.id, is_enabled: !job.is_enabled }),
      });
      fetchJobs();
    } finally {
      setSaving(null);
    }
  };

  const handleToggleAction = async (job: CronJob, action: string) => {
    setSaving(job.id);
    try {
      const newActions = { ...job.actions, [action]: !job.actions[action as keyof typeof job.actions] };
      await fetch("/api/super-admin/cron-jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: job.id, actions: newActions }),
      });
      fetchJobs();
    } finally {
      setSaving(null);
    }
  };

  const handleUpdateSchedule = async (job: CronJob, schedule: string) => {
    setSaving(job.id);
    try {
      await fetch("/api/super-admin/cron-jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: job.id, schedule_cron: schedule }),
      });
      fetchJobs();
      setEditingJob(null);
    } finally {
      setSaving(null);
    }
  };

  const handleCreateJob = async () => {
    try {
      const res = await fetch("/api/super-admin/cron-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newJob),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setNewJob({ name: "", slug: "", description: "", endpoint: "", schedule_cron: "0 9 * * *", actions: { email: false, whatsapp: false, in_app: false, database: false } });
        fetchJobs();
      }
    } catch (error) {
      console.error("Failed to create job:", error);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm("Delete this cron job?")) return;
    try {
      await fetch(`/api/super-admin/cron-jobs?id=${id}`, { method: "DELETE" });
      fetchJobs();
    } catch (error) {
      console.error("Failed to delete job:", error);
    }
  };

  const formatCron = (cron: string) => {
    const parts = cron.split(" ");
    if (parts.length !== 5) return cron;
    const [min, hour] = parts;
    if (hour !== "*" && min !== "*") {
      const h = parseInt(hour);
      const m = parseInt(min);
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      return `Daily ${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
    }
    return cron;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cron Jobs Manager</h1>
          <p className="text-gray-600">Enable/disable automated tasks and create custom jobs</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchJobs} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
            <Plus className="h-4 w-4" />
            Create Job
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Total Jobs</p>
              <p className="text-2xl font-bold">{jobs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Play className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold">{jobs.filter((j) => j.is_enabled).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Pause className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-sm text-gray-600">Paused</p>
              <p className="text-2xl font-bold">{jobs.filter((j) => !j.is_enabled).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-sm text-gray-600">Total Runs</p>
              <p className="text-2xl font-bold">{jobs.reduce((a, j) => a + j.total_runs, 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {jobs.length === 0 && (
          <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-3" />
            <p className="text-gray-600">No cron jobs found. Run the SQL migration first or create a job.</p>
          </div>
        )}
        {jobs.map((job) => (
          <div
            key={job.id}
            className={`bg-white rounded-lg border-2 p-6 transition-all ${
              job.is_enabled ? "border-green-200" : "border-gray-200 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {job.is_enabled ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-gray-400" />}
                  <h3 className="text-lg font-semibold">{job.name}</h3>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{job.endpoint}</code>
                  {job.last_status === "failed" && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">LAST RUN FAILED</span>}
                </div>
                <p className="text-sm text-gray-600 mb-3">{job.description}</p>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-gray-500 font-medium">ACTIONS:</span>
                  {Object.entries(job.actions).map(([key, enabled]) => {
                    const Icon = ACTION_ICONS[key] || Database;
                    return (
                      <button
                        key={key}
                        onClick={() => handleToggleAction(job, key)}
                        disabled={saving === job.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          enabled ? ACTION_COLORS[key] : "bg-gray-100 text-gray-400"
                        } hover:opacity-80`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {key.toUpperCase()}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <span><Clock className="h-4 w-4 inline mr-1" />{formatCron(job.schedule_cron)}</span>
                  <span>Runs: {job.total_runs} ({job.total_successes} ✓ / {job.total_failures} ✗)</span>
                  {job.last_run_at && <span>Last: {new Date(job.last_run_at).toLocaleString()}</span>}
                  {job.last_duration_ms && <span>{job.last_duration_ms}ms</span>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggle(job)}
                  disabled={saving === job.id}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    job.is_enabled ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    job.is_enabled ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
                <button onClick={() => setEditingJob(job)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Settings className="h-4 w-4" />
                </button>
                <button onClick={() => handleDeleteJob(job.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Create Custom Cron Job</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Job Name</label>
                <input type="text" value={newJob.name} onChange={(e) => setNewJob({ ...newJob, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g., Weekly Report" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input type="text" value={newJob.slug} onChange={(e) => setNewJob({ ...newJob, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g., weekly-report" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input type="text" value={newJob.description} onChange={(e) => setNewJob({ ...newJob, description: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="What this job does..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">API Endpoint</label>
                <input type="text" value={newJob.endpoint} onChange={(e) => setNewJob({ ...newJob, endpoint: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="/api/your-endpoint" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Schedule</label>
                <div className="grid grid-cols-3 gap-2">
                  {SCHEDULE_PRESETS.map((preset) => (
                    <button key={preset.value} onClick={() => setNewJob({ ...newJob, schedule_cron: preset.value })} className={`px-3 py-2 text-sm rounded-lg border ${newJob.schedule_cron === preset.value ? "bg-amber-50 border-amber-500 text-amber-700" : "border-gray-200 hover:bg-gray-50"}`}>
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Actions</label>
                <div className="flex gap-3">
                  {Object.entries(newJob.actions).map(([key, enabled]) => {
                    const Icon = ACTION_ICONS[key] || Database;
                    return (
                      <button key={key} onClick={() => setNewJob({ ...newJob, actions: { ...newJob.actions, [key]: !enabled } })} className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${enabled ? `${ACTION_COLORS[key]} border-current` : "border-gray-200 text-gray-400"}`}>
                        <Icon className="h-4 w-4" />
                        {key.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleCreateJob} disabled={!newJob.name || !newJob.slug || !newJob.endpoint} className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50">
                <Save className="h-4 w-4 inline mr-2" />Create Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Edit: {editingJob.name}</h2>
              <button onClick={() => setEditingJob(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Schedule</label>
                <div className="grid grid-cols-3 gap-2">
                  {SCHEDULE_PRESETS.map((preset) => (
                    <button key={preset.value} onClick={() => handleUpdateSchedule(editingJob, preset.value)} className={`px-3 py-2 text-sm rounded-lg border ${editingJob.schedule_cron === preset.value ? "bg-amber-50 border-amber-500 text-amber-700" : "border-gray-200 hover:bg-gray-50"}`}>
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Actions</label>
                <div className="flex gap-3">
                  {Object.entries(editingJob.actions).map(([key, enabled]) => {
                    const Icon = ACTION_ICONS[key] || Database;
                    return (
                      <button key={key} onClick={() => handleToggleAction(editingJob, key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${enabled ? `${ACTION_COLORS[key]} border-current` : "border-gray-200 text-gray-400"}`}>
                        <Icon className="h-4 w-4" />
                        {key.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setEditingJob(null)} className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
