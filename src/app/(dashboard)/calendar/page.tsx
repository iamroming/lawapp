"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, getStatusColor } from "@/lib/utils";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";

interface Hearing {
  id: string;
  hearing_date: string;
  purpose: string;
  court: string;
  court_room: string;
  judge_name: string;
  notes: string;
  outcome: string;
  is_completed: boolean;
  case: {
    id: string;
    case_number: string;
    title: string;
    status: string;
  };
}

interface CaseOption {
  id: string;
  case_number: string;
  title: string;
}

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const preselectedCaseId = searchParams.get("case_id");
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const [newHearing, setNewHearing] = useState({
    case_id: "",
    hearing_date: "",
    purpose: "",
    court: "",
    court_room: "",
    judge_name: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (preselectedCaseId && cases.length > 0) {
      setNewHearing((prev) => ({ ...prev, case_id: preselectedCaseId }));
      setShowModal(true);
    }
  }, [preselectedCaseId, cases]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isOwner = profile?.role === "owner" || profile?.role === "partner" || profile?.role === "super_admin";

    let hearingsQuery = supabase
      .from("hearings")
      .select("*, case:cases(id, case_number, title, status)")
      .order("hearing_date");
    if (!isOwner) {
      hearingsQuery = hearingsQuery.eq("created_by", user.id);
    }

    let casesQuery = supabase.from("cases").select("id, case_number, title").order("title");
    if (!isOwner) {
      casesQuery = casesQuery.or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`);
    }

    const [hearingsRes, casesRes] = await Promise.all([hearingsQuery, casesQuery]);
    setHearings((hearingsRes.data as Hearing[]) || []);
    setCases((casesRes.data as CaseOption[]) || []);
    setLoading(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getHearingsForDate = (date: Date) => {
    return hearings.filter((h) => {
      const hearingDate = new Date(h.hearing_date);
      return (
        hearingDate.getDate() === date.getDate() &&
        hearingDate.getMonth() === date.getMonth() &&
        hearingDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const handleAddHearing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHearing.case_id) {
      toast.error("Please select a case");
      return;
    }
    if (!newHearing.hearing_date) {
      toast.error("Please select a date and time");
      return;
    }
    const { error } = await supabase.from("hearings").insert({
      case_id: newHearing.case_id,
      hearing_date: newHearing.hearing_date,
      purpose: newHearing.purpose,
      court: newHearing.court,
      court_room: newHearing.court_room,
      judge_name: newHearing.judge_name,
      notes: newHearing.notes,
      is_completed: false,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Hearing scheduled!");
    setShowModal(false);
    setNewHearing({
      case_id: "",
      hearing_date: "",
      purpose: "",
      court: "",
      court_room: "",
      judge_name: "",
      notes: "",
    });
    fetchData();
  };

  const toggleComplete = async (hearing: Hearing) => {
    const { error } = await supabase
      .from("hearings")
      .update({ is_completed: !hearing.is_completed })
      .eq("id", hearing.id);

    if (error) {
      toast.error(error.message);
      return;
    }
    fetchData();
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Court Calendar</h1>
          <p className="text-gray-500">Track your hearings and court dates</p>
        </div>
        <Button onClick={() => {
          if (selectedDate) {
            const dateStr = selectedDate.toISOString().slice(0, 16);
            setNewHearing((prev) => ({ ...prev, hearing_date: dateStr }));
          }
          setShowModal(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Hearing
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CardTitle>
            {currentDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.charAt(0)}</span>
              </div>
            ))}
            {days.map((day, index) => {
              if (!day) return <div key={`empty-${index}`} />;
              const dayHearings = getHearingsForDate(day);
              const isToday =
                day.getDate() === today.getDate() &&
                day.getMonth() === today.getMonth() &&
                day.getFullYear() === today.getFullYear();
              const isSelected =
                selectedDate &&
                day.getDate() === selectedDate.getDate() &&
                day.getMonth() === selectedDate.getMonth() &&
                day.getFullYear() === selectedDate.getFullYear();

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[60px] sm:min-h-[80px] p-1 rounded-lg border cursor-pointer transition-colors ${
                    isToday ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
                  } ${isSelected ? "ring-2 ring-blue-500" : ""}`}
                  onClick={() => setSelectedDate(day)}
                >
                  <div
                    className={`text-sm font-medium ${isToday ? "text-blue-600" : ""}`}
                  >
                    {day.getDate()}
                  </div>
                  {dayHearings.slice(0, 2).map((h) => (
                    <div
                      key={h.id}
                      className="text-xs bg-blue-100 text-blue-700 rounded px-1 py-0.5 mt-0.5 truncate"
                    >
                      {h.case?.title}
                    </div>
                  ))}
                  {dayHearings.length > 2 && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      +{dayHearings.length - 2} more
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Hearings */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>
              Hearings on {formatDate(selectedDate)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getHearingsForDate(selectedDate).length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hearings on this date.</p>
            ) : (
              <div className="space-y-3">
                {getHearingsForDate(selectedDate).map((h) => (
                  <div key={h.id} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{h.case?.title}</h4>
                          <Badge className={getStatusColor(h.case?.status || "")}>
                            {h.case?.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">{h.case?.case_number}</p>
                        {h.purpose && <p className="text-sm">{h.purpose}</p>}
                        <div className="flex gap-4 text-xs text-gray-500">
                          {h.court && <span>Court: {h.court}</span>}
                          {h.court_room && <span>Room: {h.court_room}</span>}
                          {h.judge_name && <span>Judge: {h.judge_name}</span>}
                        </div>
                      </div>
                      <Button
                        variant={h.is_completed ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleComplete(h)}
                      >
                        {h.is_completed ? "Completed" : "Mark Complete"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Hearing Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Schedule New Hearing">
        <form onSubmit={handleAddHearing} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Case *</label>
            <Select
              options={[
                { value: "", label: "Select a case" },
                ...cases.map((c) => ({
                  value: c.id,
                  label: `${c.case_number} - ${c.title}`,
                })),
              ]}
              value={newHearing.case_id}
              onChange={(e) => setNewHearing((prev) => ({ ...prev, case_id: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Date & Time *</label>
            <Input
              type="datetime-local"
              value={newHearing.hearing_date}
              onChange={(e) =>
                setNewHearing((prev) => ({ ...prev, hearing_date: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Purpose</label>
            <Input
              placeholder="e.g., Final arguments, Evidence recording"
              value={newHearing.purpose}
              onChange={(e) => setNewHearing((prev) => ({ ...prev, purpose: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Court</label>
              <Input
                placeholder="e.g., Court No. 5"
                value={newHearing.court}
                onChange={(e) => setNewHearing((prev) => ({ ...prev, court: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Judge</label>
              <Input
                placeholder="Hon'ble Justice..."
                value={newHearing.judge_name}
                onChange={(e) =>
                  setNewHearing((prev) => ({ ...prev, judge_name: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              placeholder="Additional notes..."
              value={newHearing.notes}
              onChange={(e) => setNewHearing((prev) => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Schedule Hearing</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
