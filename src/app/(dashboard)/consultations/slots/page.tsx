"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Clock } from "lucide-react";
import toast from "react-hot-toast";

interface Slot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  consultation_type: string;
  fee: number;
  duration_minutes: number;
  is_active: boolean;
}

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DAY_COLORS = [
  "bg-red-50 border-red-200",
  "bg-blue-50 border-blue-200",
  "bg-green-50 border-green-200",
  "bg-yellow-50 border-yellow-200",
  "bg-purple-50 border-purple-200",
  "bg-pink-50 border-pink-200",
  "bg-orange-50 border-orange-200",
];

export default function ConsultationSlotsPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({
    day_of_week: "1",
    start_time: "09:00",
    end_time: "10:00",
    consultation_type: "general",
    fee: "",
    duration_minutes: "30",
  });
  const supabase = createClient();

  useEffect(() => {
    loadSlots();
  }, []);

  async function loadSlots() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("consultation_slots")
      .select("*")
      .eq("lawyer_id", user.id)
      .order("day_of_week");

    setSlots(data || []);
    setLoading(false);
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const res = await fetch("/api/consultations/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day_of_week: parseInt(form.day_of_week),
          start_time: form.start_time,
          end_time: form.end_time,
          consultation_type: form.consultation_type,
          fee: form.fee ? parseFloat(form.fee) : 0,
          duration_minutes: parseInt(form.duration_minutes),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create slot");
      }

      toast.success("Availability slot added!");
      setShowForm(false);
      setForm({
        day_of_week: "1",
        start_time: "09:00",
        end_time: "10:00",
        consultation_type: "general",
        fee: "",
        duration_minutes: "30",
      });
      loadSlots();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("consultation_slots")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete slot");
    } else {
      toast.success("Slot deleted");
      loadSlots();
    }
  };

  const groupedSlots = DAYS.map((day, index) => ({
    day,
    index,
    slots: slots.filter((s) => s.day_of_week === index),
  }));

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
          <Clock className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Consultation Availability</h1>
            <p className="text-gray-500">
              Manage your weekly availability slots
            </p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Slot
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Availability Slot</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day of Week *
                  </label>
                  <Select
                    options={DAYS.map((d, i) => ({ value: String(i), label: d }))}
                    value={form.day_of_week}
                    onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <Input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <Input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Consultation Type
                  </label>
                  <Select
                    options={[
                      { value: "general", label: "General" },
                      { value: "initial", label: "Initial Consultation" },
                      { value: "follow_up", label: "Follow-up" },
                      { value: "review", label: "Case Review" },
                    ]}
                    value={form.consultation_type}
                    onChange={(e) => setForm({ ...form, consultation_type: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <Select
                    options={[
                      { value: "15", label: "15 min" },
                      { value: "30", label: "30 min" },
                      { value: "45", label: "45 min" },
                      { value: "60", label: "60 min" },
                    ]}
                    value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
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
                    placeholder="0 for free"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                  Add Slot
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {groupedSlots.map(({ day, index, slots: daySlots }) => (
          <Card key={index} className={DAY_COLORS[index]}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{day}</CardTitle>
            </CardHeader>
            <CardContent>
              {daySlots.length === 0 ? (
                <p className="text-sm text-gray-500">No availability set</p>
              ) : (
                <div className="space-y-2">
                  {daySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-2 rounded bg-white border"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {slot.start_time} - {slot.end_time}
                        </p>
                        <p className="text-xs text-gray-500">
                          {slot.duration_minutes} min • {slot.consultation_type}
                          {slot.fee > 0 && ` • ₹${slot.fee}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(slot.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
