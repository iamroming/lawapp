"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatsCard } from "@/components/ui/stats-card";
import {
  Calendar,
  Clock,
  User,
  Plus,
  Loader2,
  Phone,
  Video,
  MapPin,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface Consultation {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  scheduled_at: string;
  duration_minutes: number;
  consultation_type: string;
  status: string;
  fee: number;
  notes: string | null;
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  "no-show": "bg-yellow-100 text-yellow-800",
};

const typeLabels: Record<string, string> = {
  initial: "Initial Consultation",
  follow_up: "Follow-up",
  general: "General",
  review: "Case Review",
};

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    scheduled_at: "",
    duration_minutes: "30",
    consultation_type: "initial",
    fee: "",
    notes: "",
  });
  const supabase = createClient();

  useEffect(() => {
    loadConsultations();
  }, []);

  async function loadConsultations() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("consultations")
      .select("*")
      .eq("lawyer_id", user.id)
      .order("scheduled_at", { ascending: false });

    setConsultations(data || []);
    setLoading(false);
  }

  const today = new Date().toISOString().split("T")[0];
  const todayCount = consultations.filter(
    (c) => c.scheduled_at?.startsWith(today) && c.status === "scheduled"
  ).length;
  const upcomingCount = consultations.filter(
    (c) => new Date(c.scheduled_at) > new Date() && c.status === "scheduled"
  ).length;
  const completedCount = consultations.filter(
    (c) => c.status === "completed"
  ).length;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_name || !form.scheduled_at) {
      toast.error("Client name and date/time are required");
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: form.client_name,
          client_email: form.client_email || null,
          client_phone: form.client_phone || null,
          scheduled_at: form.scheduled_at,
          duration_minutes: parseInt(form.duration_minutes),
          consultation_type: form.consultation_type,
          fee: form.fee ? parseFloat(form.fee) : 0,
          notes: form.notes || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create consultation");
      }

      toast.success("Consultation scheduled!");
      setShowForm(false);
      setForm({
        client_name: "",
        client_email: "",
        client_phone: "",
        scheduled_at: "",
        duration_minutes: "30",
        consultation_type: "initial",
        fee: "",
        notes: "",
      });
      loadConsultations();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create");
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    const { error } = await supabase
      .from("consultations")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Consultation ${status}`);
      loadConsultations();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Consultations</h1>
            <p className="text-gray-500">Manage client consultations</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" />
          Schedule Consultation
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Today" value={todayCount} icon={<Calendar className="h-5 w-5" />} />
        <StatsCard title="Upcoming" value={upcomingCount} icon={<Clock className="h-5 w-5" />} />
        <StatsCard title="Completed" value={completedCount} icon={<User className="h-5 w-5" />} />
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule New Consultation</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Name *
                  </label>
                  <Input
                    value={form.client_name}
                    onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={form.client_email}
                    onChange={(e) => setForm({ ...form, client_email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <Input
                    value={form.client_phone}
                    onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date & Time *
                  </label>
                  <Input
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <Select
                    options={[
                      { value: "15", label: "15 minutes" },
                      { value: "30", label: "30 minutes" },
                      { value: "45", label: "45 minutes" },
                      { value: "60", label: "60 minutes" },
                    ]}
                    value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <Select
                    options={[
                      { value: "initial", label: "Initial Consultation" },
                      { value: "follow_up", label: "Follow-up" },
                      { value: "general", label: "General" },
                      { value: "review", label: "Case Review" },
                    ]}
                    value={form.consultation_type}
                    onChange={(e) => setForm({ ...form, consultation_type: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fee (₹)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={form.fee}
                    onChange={(e) => setForm({ ...form, fee: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                  Schedule
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Consultations ({consultations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {consultations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No consultations scheduled yet.
            </p>
          ) : (
            <div className="space-y-3">
              {consultations.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-50 flex flex-col items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">
                        {new Date(c.scheduled_at).toLocaleDateString("en-IN", {
                          month: "short",
                        })}
                      </span>
                      <span className="text-lg font-bold text-blue-700">
                        {new Date(c.scheduled_at).getDate()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{c.client_name}</p>
                      <p className="text-sm text-gray-500">
                        {typeLabels[c.consultation_type] || c.consultation_type} •{" "}
                        {c.duration_minutes} min •{" "}
                        {new Date(c.scheduled_at).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {c.fee > 0 && (
                        <p className="text-sm text-gray-500">
                          ₹{c.fee.toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[c.status] || "bg-gray-100 text-gray-800"}>
                      {c.status}
                    </Badge>
                    {c.status === "scheduled" && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusUpdate(c.id, "completed")}
                        >
                          Complete
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusUpdate(c.id, "cancelled")}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
