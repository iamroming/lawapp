"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/utils";
import {
  Clock,
  Plus,
  Bell,
  Calendar,
  MessageSquare,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  Send,
} from "lucide-react";
import toast from "react-hot-toast";

interface ScheduledReminder {
  id: string;
  title: string;
  message: string;
  reminder_date: string;
  channels: string[];
  status: string;
  sent_channels: string[];
  failed_channels: string[];
  case: { id: string; case_number: string; title: string } | null;
  client: { id: string; full_name: string; phone: string } | null;
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<ScheduledReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState("pending");
  const [cases, setCases] = useState<{ id: string; case_number: string; title: string }[]>([]);
  const [clients, setClients] = useState<{ id: string; full_name: string; phone: string }[]>([]);
  const supabase = createClient();

  const [newReminder, setNewReminder] = useState({
    case_id: "",
    client_id: "",
    title: "",
    message: "",
    reminder_date: "",
    channels: ["in_app"] as string[],
  });

  useEffect(() => {
    fetchReminders();
    fetchCasesAndClients();
  }, [filter]);

  const fetchReminders = async () => {
    try {
      const response = await fetch(`/api/reminders?status=${filter}`);
      if (!response.ok) throw new Error("Failed to fetch reminders");
      const result = await response.json();
      setReminders((result.data || []) as ScheduledReminder[]);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      toast.error("Failed to fetch reminders");
    } finally {
      setLoading(false);
    }
  };

  const fetchCasesAndClients = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, firm_id")
      .eq("id", user.id)
      .single();

    const isOwner = profile?.role === "owner" || profile?.role === "partner" || profile?.role === "super_admin";
    const firmId = profile?.firm_id || user.id;

    const casesQuery = supabase.from("cases").select("id, case_number, title").is("deleted_at", null);
    const clientsQuery = supabase.from("clients").select("id, full_name, phone").is("deleted_at", null);

    if (isOwner) {
      casesQuery.eq("firm_id", firmId);
      clientsQuery.eq("firm_id", firmId);
    } else {
      casesQuery.or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`);
      clientsQuery.eq("created_by", user.id);
    }

    const [casesRes, clientsRes] = await Promise.all([casesQuery, clientsQuery]);
    setCases((casesRes.data || []) as { id: string; case_number: string; title: string }[]);
    setClients((clientsRes.data || []) as { id: string; full_name: string; phone: string }[]);
  };

  const handleAddReminder = async () => {
    if (!newReminder.title || !newReminder.reminder_date) {
      toast.error("Title and date are required");
      return;
    }

    try {
      const response = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReminder),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error);
      }

      toast.success("Reminder created");
      setShowAddModal(false);
      setNewReminder({ case_id: "", client_id: "", title: "", message: "", reminder_date: "", channels: ["in_app"] });
      fetchReminders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create reminder");
    }
  };

  const handleDeleteReminder = async (id: string) => {
    if (!confirm("Delete this reminder?")) return;

    try {
      const response = await fetch(`/api/reminders?id=${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete reminder");
      toast.success("Reminder deleted");
      fetchReminders();
    } catch (error) {
      toast.error("Failed to delete reminder");
    }
  };

  const toggleChannel = (channel: string) => {
    setNewReminder((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed": return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent": return "bg-green-100 text-green-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email": return <Mail className="h-3 w-3" />;
      case "sms": return <Phone className="h-3 w-3" />;
      case "whatsapp": return <MessageSquare className="h-3 w-3" />;
      default: return <Bell className="h-3 w-3" />;
    }
  };

  const isOverdue = (reminderDate: string) => {
    return new Date(reminderDate) < new Date();
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-blue-600" />
            Reminders & Notifications
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">Manage your hearing reminders and notifications</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="text-sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Reminder
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Pending</p>
                <p className="text-2xl font-bold">{reminders.filter((r) => r.status === "pending").length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Sent</p>
                <p className="text-2xl font-bold">{reminders.filter((r) => r.status === "sent").length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Failed</p>
                <p className="text-2xl font-bold">{reminders.filter((r) => r.status === "failed").length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Overdue</p>
                <p className="text-2xl font-bold">
                  {reminders.filter((r) => r.status === "pending" && isOverdue(r.reminder_date)).length}
                </p>
              </div>
              <Bell className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {["pending", "sent", "failed", "all"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Reminders List */}
      {reminders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No reminders yet</h3>
            <p className="text-[var(--text-secondary)] mb-4">Create your first reminder to never miss a hearing</p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Reminder
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <Card key={reminder.id} className={`hover:shadow-md transition-shadow ${
              isOverdue(reminder.reminder_date) && reminder.status === "pending" ? "border-red-300 bg-red-50" : ""
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(reminder.status)}
                      <h3 className="font-medium text-sm">{reminder.title}</h3>
                      <Badge className={getStatusColor(reminder.status)}>{reminder.status}</Badge>
                      {isOverdue(reminder.reminder_date) && reminder.status === "pending" && (
                        <Badge className="bg-red-100 text-red-800">Overdue</Badge>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mb-2">{reminder.message}</p>
                    <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(reminder.reminder_date).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                      {reminder.case && (
                        <span>{reminder.case.case_number} - {reminder.case.title}</span>
                      )}
                      {reminder.client && (
                        <span>Client: {reminder.client.full_name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {reminder.channels.map((channel) => (
                        <span
                          key={channel}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                            reminder.sent_channels?.includes(channel)
                              ? "bg-green-100 text-green-700"
                              : reminder.failed_channels?.includes(channel)
                              ? "bg-red-100 text-red-700"
                              : "bg-[var(--surface-subtle)] text-[var(--text-secondary)]"
                          }`}
                        >
                          {getChannelIcon(channel)}
                          {channel}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteReminder(reminder.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Reminder Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create New Reminder"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Title *</label>
            <Input
              placeholder="e.g., Hearing preparation for Sharma case"
              value={newReminder.title}
              onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Message</label>
            <textarea
              placeholder="Detailed reminder message..."
              value={newReminder.message}
              onChange={(e) => setNewReminder({ ...newReminder, message: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-sm"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Date & Time *</label>
            <input
              type="datetime-local"
              value={newReminder.reminder_date}
              onChange={(e) => setNewReminder({ ...newReminder, reminder_date: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Link to Case</label>
              <select
                value={newReminder.case_id}
                onChange={(e) => setNewReminder({ ...newReminder, case_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Select case...</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>{c.case_number} - {c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Notify Client</label>
              <select
                value={newReminder.client_id}
                onChange={(e) => setNewReminder({ ...newReminder, client_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Select client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Notification Channels</label>
            <div className="flex gap-2">
              {[
                { id: "in_app", label: "In-App", icon: Bell },
                { id: "email", label: "Email", icon: Mail },
                { id: "sms", label: "SMS", icon: Phone },
                { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
              ].map((channel) => (
                <Button
                  key={channel.id}
                  variant={newReminder.channels.includes(channel.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleChannel(channel.id)}
                  className="flex items-center gap-1"
                >
                  <channel.icon className="h-3 w-3" />
                  {channel.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddReminder}>
              <Send className="h-4 w-4 mr-2" />
              Create Reminder
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
