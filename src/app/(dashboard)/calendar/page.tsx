"use client";
import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { dbWrite } from "@/lib/db-write";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { formatDate, getStatusColor } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  User,
  Gavel,
  CheckCircle2,
  CalendarDays,
  Scale,
  FileText,
  Search,
  Loader2,
  Trash2,
  X,
  ChevronDown,
  BookOpen,
  CalendarHeart,
} from "lucide-react";
import toast from "react-hot-toast";
import { useUser } from "@/hooks/use-user";

type EventType = "hearing" | "rule" | "event";

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
  client_id: string | null;
}

interface ClientOption {
  id: string;
  full_name: string;
}

interface CalendarRule {
  id: string;
  title: string;
  description: string;
  date: string;
  color: string;
  court: string;
  created_at: string;
}

interface CalendarEventType {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  color: string;
  location: string;
  created_at: string;
}

const EVENT_COLORS: Record<EventType, { bg: string; dot: string; border: string; badge: string }> = {
  hearing: { bg: "bg-blue-50", dot: "bg-blue-500", border: "border-blue-200", badge: "bg-blue-100 text-blue-700" },
  rule: { bg: "bg-amber-50", dot: "bg-amber-500", border: "border-amber-200", badge: "bg-amber-100 text-amber-700" },
  event: { bg: "bg-emerald-50", dot: "bg-emerald-500", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700" },
};

const RULE_COLORS = ["#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];
const EVENT_COLORS_OPTIONS = ["#10b981", "#6366f1", "#f97316", "#e11d48", "#0ea5e9"];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function getDaysInMonth(date: Date): (Date | null)[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay();
  const days: (Date | null)[] = [];
  for (let i = 0; i < startingDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
  return days;
}

function CalendarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCaseId = searchParams.get("case_id");
  const supabase = createClient();
  const { user: appUser } = useUser();

  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [rules, setRules] = useState<CalendarRule[]>([]);
  const [events, setEvents] = useState<CalendarEventType[]>([]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "hearing" | "rule" | "event">("all");

  const [showHearingModal, setShowHearingModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const [newHearing, setNewHearing] = useState({
    case_id: "",
    hearing_date: "",
    purpose: "",
    court: "",
    court_room: "",
    judge_name: "",
    notes: "",
  });

  const [newRule, setNewRule] = useState({
    title: "",
    description: "",
    date: "",
    court: "",
    color: RULE_COLORS[0],
  });

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    color: EVENT_COLORS_OPTIONS[0],
  });

  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-client-dropdown]") && !target.closest("[data-add-dropdown]")) {
        setShowClientDropdown(false);
        setShowAddDropdown(false);
        setShowExportDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchData();
    // TODO: court_rules and court_events tables don't exist yet. Using localStorage as temporary persistence.
    const savedRules = localStorage.getItem("calendar_rules");
    const savedEvents = localStorage.getItem("calendar_events");
    if (savedRules) {
      try { setRules(JSON.parse(savedRules)); } catch {}
    }
    if (savedEvents) {
      try { setEvents(JSON.parse(savedEvents)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (preselectedCaseId && cases.length > 0) {
      setNewHearing((prev) => ({ ...prev, case_id: preselectedCaseId }));
      setShowHearingModal(true);
    }
  }, [preselectedCaseId, cases]);

  const fetchData = async () => {
    if (!appUser) { setLoading(false); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, firm_id")
      .eq("id", appUser?.uuid)
      .single();

    const isOwner = profile?.role === "owner" || profile?.role === "partner" || profile?.role === "super_admin";
    const firmId = profile?.firm_id || appUser?.uuid;

    let hearingsQuery = supabase
      .from("hearings")
      .select("*, case:cases(id, case_number, title, status)")
      .is("deleted_at", null)
      .order("hearing_date");
    if (isOwner) {
      hearingsQuery = hearingsQuery.eq("firm_id", firmId);
    } else {
      hearingsQuery = hearingsQuery.eq("created_by", appUser?.uuid);
    }

    let casesQuery = supabase.from("cases").select("id, case_number, title, client_id").is("deleted_at", null).order("title");
    if (isOwner) {
      casesQuery = casesQuery.eq("firm_id", firmId);
    } else {
      casesQuery = casesQuery.or(`assigned_to.eq.${appUser?.uuid},created_by.eq.${appUser?.uuid}`);
    }

    const clientsQuery = supabase
      .from("clients")
      .select("id, full_name")
      .eq("firm_id", firmId)
      .is("deleted_at", null)
      .order("full_name");

    const [hearingsRes, casesRes, clientsRes] = await Promise.all([hearingsQuery, casesQuery, clientsQuery]);
    setHearings((hearingsRes.data as Hearing[]) || []);
    setCases((casesRes.data as CaseOption[]) || []);
    setClients((clientsRes.data as ClientOption[]) || []);
    setLoading(false);
  };

  const handleAddHearing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHearing.case_id) { toast.error("Please select a case"); return; }
    if (!newHearing.hearing_date) { toast.error("Please select a date and time"); return; }

    if (!appUser) { toast.error("Not authenticated"); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("firm_id")
      .eq("id", appUser?.uuid)
      .single();

    const firmId = profile?.firm_id || appUser?.uuid;

    const currentCase = cases.find((c) => c.id === newHearing.case_id);
    const { error } = await dbWrite("hearings", "insert", {
      case_id: newHearing.case_id,
      hearing_date: newHearing.hearing_date,
      purpose: newHearing.purpose,
      court: newHearing.court,
      court_room: newHearing.court_room,
      judge_name: newHearing.judge_name,
      notes: newHearing.notes,
      is_completed: false,
      status: "scheduled",
      case_number: currentCase?.case_number || null,
      firm_id: firmId,
      created_by: appUser?.uuid,
    });
    if (error) { toast.error(error); return; }
    toast.success("Hearing scheduled!");
    setShowHearingModal(false);
    setSelectedClientId("");
    setClientSearch("");
    setNewHearing({ case_id: "", hearing_date: "", purpose: "", court: "", court_room: "", judge_name: "", notes: "" });
    fetchData();
  };

  const toggleComplete = async (hearing: Hearing) => {
    if (!appUser) { toast.error("Not authenticated"); return; }
    const { data: profile } = await supabase
      .from("profiles")
      .select("firm_id")
      .eq("id", appUser?.uuid)
      .single();
    const firmId = profile?.firm_id || appUser?.uuid;
    const { error } = await dbWrite("hearings", "update", { is_completed: !hearing.is_completed }, { id: hearing.id, firm_id: firmId });
    if (error) { toast.error(error); return; }
    fetchData();
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.title || !newRule.date) { toast.error("Title and date are required"); return; }
    if (!appUser) { toast.error("Not authenticated"); return; }
    const rule: CalendarRule = {
      id: generateId(),
      title: newRule.title,
      description: newRule.description,
      date: newRule.date,
      color: newRule.color,
      court: newRule.court,
      created_at: new Date().toISOString(),
    };
    setRules((prev) => {
      const next = [...prev, rule];
      localStorage.setItem("calendar_rules", JSON.stringify(next));
      return next;
    });
    toast.success("Court rule added!");
    setShowRuleModal(false);
    setNewRule({ title: "", description: "", date: "", court: "", color: RULE_COLORS[0] });
  };

  const deleteRule = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this rule?")) return;
    setRules((prev) => {
      const next = prev.filter((r) => r.id !== id);
      localStorage.setItem("calendar_rules", JSON.stringify(next));
      return next;
    });
    toast.success("Rule deleted");
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) { toast.error("Title and date are required"); return; }
    if (!appUser) { toast.error("Not authenticated"); return; }
    const evt: CalendarEventType = {
      id: generateId(),
      title: newEvent.title,
      description: newEvent.description,
      date: newEvent.date,
      time: newEvent.time,
      color: newEvent.color,
      location: newEvent.location,
      created_at: new Date().toISOString(),
    };
    setEvents((prev) => {
      const next = [...prev, evt];
      localStorage.setItem("calendar_events", JSON.stringify(next));
      return next;
    });
    toast.success("Event added!");
    setShowEventModal(false);
    setNewEvent({ title: "", description: "", date: "", time: "", location: "", color: EVENT_COLORS_OPTIONS[0] });
  };

  const deleteEvent = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    setEvents((prev) => {
      const next = prev.filter((e) => e.id !== id);
      localStorage.setItem("calendar_events", JSON.stringify(next));
      return next;
    });
    toast.success("Event deleted");
  };

  const isSameDay = useCallback((d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
  }, []);

  const getHearingsForDate = useCallback((date: Date) => {
    return hearings.filter((h) => isSameDay(new Date(h.hearing_date), date));
  }, [hearings, isSameDay]);

  const getRulesForDate = useCallback((date: Date) => {
    return rules.filter((r) => isSameDay(new Date(r.date), date));
  }, [rules, isSameDay]);

  const getEventsForDate = useCallback((date: Date) => {
    return events.filter((e) => isSameDay(new Date(e.date), date));
  }, [events, isSameDay]);

  const getAllItemsForDate = useCallback((date: Date) => {
    const items: { type: EventType; title: string; subtitle: string; color: string; id: string; date: string }[] = [];

    getHearingsForDate(date).forEach((h) => {
      items.push({
        type: "hearing",
        title: h.case?.title || "Hearing",
        subtitle: h.purpose || h.court || "",
        color: "bg-blue-500",
        id: h.id,
        date: h.hearing_date,
      });
    });

    getRulesForDate(date).forEach((r) => {
      items.push({
        type: "rule",
        title: r.title,
        subtitle: r.court || "",
        color: "bg-amber-500",
        id: r.id,
        date: r.date,
      });
    });

    getEventsForDate(date).forEach((e) => {
      items.push({
        type: "event",
        title: e.title,
        subtitle: e.location || "",
        color: "bg-emerald-500",
        id: e.id,
        date: e.date,
      });
    });

    return items;
  }, [getHearingsForDate, getRulesForDate, getEventsForDate]);

  const filteredUpcoming = useMemo(() => {
    const now = new Date();
    const upcoming: { type: EventType; title: string; subtitle: string; date: string; dotColor: string; id: string }[] = [];

    hearings.forEach((h) => {
      const d = new Date(h.hearing_date);
      if (d >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        upcoming.push({
          type: "hearing",
          title: h.case?.title || "Hearing",
          subtitle: h.purpose || h.court || "",
          date: h.hearing_date,
          dotColor: "bg-blue-500",
          id: h.id,
        });
      }
    });

    rules.forEach((r) => {
      const d = new Date(r.date);
      if (d >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        upcoming.push({
          type: "rule",
          title: r.title,
          subtitle: r.court || "",
          date: r.date,
          dotColor: "bg-amber-500",
          id: r.id,
        });
      }
    });

    events.forEach((e) => {
      const d = new Date(e.date);
      if (d >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        upcoming.push({
          type: "event",
          title: e.title,
          subtitle: e.location || "",
          date: e.date,
          dotColor: "bg-emerald-500",
          id: e.id,
        });
      }
    });

    if (activeFilter !== "all") {
      return upcoming
        .filter((item) => item.type === activeFilter)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    return upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [hearings, rules, events, activeFilter]);

  const searchFilteredUpcoming = useMemo(() => {
    if (!searchQuery.trim()) return filteredUpcoming;
    const q = searchQuery.toLowerCase();
    return filteredUpcoming.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q)
    );
  }, [filteredUpcoming, searchQuery]);

  const days = useMemo(() => getDaysInMonth(currentDate), [currentDate]);

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const formatUpcomingDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const diffMs = d.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays <= 7) return `In ${diffDays} days`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isDateToday = (date: Date) => isSameDay(date, today);
  const isDateSelected = (date: Date) => selectedDate ? isSameDay(date, selectedDate) : false;

  const handleOpenAddHearing = () => {
    if (selectedDate) {
      const dateStr = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        9, 0
      ).toISOString().slice(0, 16);
      setNewHearing((prev) => ({ ...prev, hearing_date: dateStr }));
    }
    setShowHearingModal(true);
    setShowAddDropdown(false);
  };

  const handleOpenAddRule = () => {
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().slice(0, 10);
      setNewRule((prev) => ({ ...prev, date: dateStr }));
    }
    setShowRuleModal(true);
    setShowAddDropdown(false);
  };

  const handleOpenAddEvent = () => {
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().slice(0, 10);
      setNewEvent((prev) => ({ ...prev, date: dateStr }));
    }
    setShowEventModal(true);
    setShowAddDropdown(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your hearings, rules, and events</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" data-add-dropdown>
            <Button
              variant="outline"
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="gap-2 border-gray-200"
            >
              <FileText className="h-4 w-4" />
              Export
              <ChevronDown className="h-3 w-3" />
            </Button>
            {showExportDropdown && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                <button
                  onClick={async () => {
                    setExporting("pdf");
                    setShowExportDropdown(false);
                    const month = currentDate.getMonth() + 1;
                    const year = currentDate.getFullYear();
                    window.open(`/api/export/calendar-pdf?month=${month}&year=${year}&type=${activeFilter}`, "_blank");
                    setTimeout(() => setExporting(null), 2000);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">PDF</p>
                    <p className="text-xs text-gray-400">Printable calendar</p>
                  </div>
                </button>
                <button
                  onClick={async () => {
                    setExporting("excel");
                    setShowExportDropdown(false);
                    const month = currentDate.getMonth() + 1;
                    const year = currentDate.getFullYear();
                    window.open(`/api/export/calendar-excel?month=${month}&year=${year}&type=${activeFilter}`, "_blank");
                    setTimeout(() => setExporting(null), 2000);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Excel</p>
                    <p className="text-xs text-gray-400">Spreadsheet</p>
                  </div>
                </button>
                <button
                  onClick={async () => {
                    setExporting("ics");
                    setShowExportDropdown(false);
                    const month = currentDate.getMonth() + 1;
                    const year = currentDate.getFullYear();
                    window.open(`/api/export/calendar-ics?month=${month}&year=${year}&type=${activeFilter}`, "_blank");
                    setTimeout(() => setExporting(null), 2000);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <CalendarDays className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Google Calendar</p>
                    <p className="text-xs text-gray-400">.ics file import</p>
                  </div>
                </button>
              </div>
            )}
          </div>
          <div className="relative" data-add-dropdown>
            <Button
              onClick={() => setShowAddDropdown(!showAddDropdown)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Add
              <ChevronDown className="h-4 w-4" />
            </Button>
          {showAddDropdown && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <button
                onClick={handleOpenAddHearing}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <Gavel className="h-4 w-4 text-blue-500" />
                Hearing
              </button>
              <button
                onClick={handleOpenAddRule}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <BookOpen className="h-4 w-4 text-amber-500" />
                Court Rule
              </button>
              <button
                onClick={handleOpenAddEvent}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <CalendarHeart className="h-4 w-4 text-emerald-500" />
                Event
              </button>
            </div>
          )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(["all", "hearing", "rule", "event"] as const).map((filter) => {
          const isActive = activeFilter === filter;
          const label = filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1) + "s";
          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {filter !== "all" && (
                <span className={`inline-block h-2 w-2 rounded-full mr-2 ${EVENT_COLORS[filter].dot}`} />
              )}
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-0 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">

        <div className="w-[300px] border-r border-gray-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search upcoming..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Upcoming</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {searchFilteredUpcoming.length} item{searchFilteredUpcoming.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {searchFilteredUpcoming.length === 0 ? (
              <div className="p-6 text-center">
                <CalendarDays className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">No upcoming items</p>
                <p className="text-xs text-gray-400 mt-1">Click + to add something</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {searchFilteredUpcoming.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="px-4 py-3 hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedDate(new Date(item.date))}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${item.dotColor} mt-1.5 shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        {item.subtitle && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{item.subtitle}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${EVENT_COLORS[item.type].badge}`}>
                            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                          </span>
                          <span className="text-xs text-gray-400">{formatUpcomingDate(item.date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">

          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateMonth(-1)}
                className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-bold text-gray-900 w-48 text-center">
                {formatMonthYear(currentDate)}
              </h2>
              <button
                onClick={() => navigateMonth(1)}
                className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Today
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/50">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-100 last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 flex-1">
            {days.map((day, index) => {
              if (!day) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="min-h-[100px] border-r border-b border-gray-100 bg-gray-50/30"
                  />
                );
              }

              const dayItems = getAllItemsForDate(day);
              const isToday = isDateToday(day);
              const isSelected = isDateSelected(day);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[100px] p-2 border-r border-b border-gray-100 last:border-r-0 cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? "bg-indigo-50/50 ring-2 ring-inset ring-indigo-500"
                      : isToday
                      ? "bg-gray-50"
                      : "hover:bg-gray-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-sm font-semibold inline-flex items-center justify-center h-7 w-7 rounded-full transition-colors ${
                        isToday
                          ? "bg-indigo-600 text-white"
                          : isSelected
                          ? "text-indigo-600"
                          : "text-gray-700"
                      }`}
                    >
                      {day.getDate()}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {dayItems.slice(0, 3).map((item) => (
                      <div
                        key={`${item.type}-${item.id}`}
                        className="flex items-center gap-1"
                      >
                        <div className={`h-1.5 w-1.5 rounded-full ${item.color} shrink-0`} />
                        <span className="text-[10px] text-gray-600 truncate leading-tight">
                          {item.title}
                        </span>
                      </div>
                    ))}
                    {dayItems.length > 3 && (
                      <div className="text-[10px] text-gray-400 font-medium pl-0.5">
                        +{dayItems.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedDate && (
        <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  {selectedDate.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </h3>
                <p className="text-xs text-gray-500">
                  {getAllItemsForDate(selectedDate).length} item{getAllItemsForDate(selectedDate).length !== 1 ? "s" : ""} scheduled
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedDate(null)}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6">
            {getAllItemsForDate(selectedDate).length === 0 ? (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <CalendarDays className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">No items scheduled</p>
                <p className="text-xs text-gray-400 mt-1">Click the + button to add something</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getHearingsForDate(selectedDate).map((h) => {
                  const hearingTime = new Date(h.hearing_date).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <div
                      key={h.id}
                      className={`group relative rounded-xl border transition-all duration-200 overflow-hidden ${
                        h.is_completed
                          ? "border-gray-200 bg-gray-50/50 opacity-70"
                          : "border-blue-200 hover:shadow-md"
                      }`}
                    >
                      <div className="flex">
                        <div className={`w-1.5 shrink-0 bg-blue-500 ${h.is_completed ? "opacity-40" : ""}`} />
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                  Hearing
                                </span>
                                {h.is_completed && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                    Done
                                  </span>
                                )}
                              </div>
                              <h4 className={`font-semibold text-sm ${h.is_completed ? "line-through text-gray-400" : "text-gray-900"}`}>
                                {h.case?.title}
                              </h4>
                              <p className="text-xs text-gray-500 mb-2">{h.case?.case_number}</p>
                              {h.purpose && (
                                <div className="flex items-center gap-1.5 mb-2">
                                  <FileText className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs text-gray-600">{h.purpose}</span>
                                </div>
                              )}
                              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {hearingTime}
                                </span>
                                {h.court && (
                                  <span className="inline-flex items-center gap-1">
                                    <Scale className="h-3 w-3" /> {h.court}
                                  </span>
                                )}
                                {h.court_room && (
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> Room {h.court_room}
                                  </span>
                                )}
                                {h.judge_name && (
                                  <span className="inline-flex items-center gap-1">
                                    <User className="h-3 w-3" /> {h.judge_name}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant={h.is_completed ? "outline" : "default"}
                              size="sm"
                              onClick={() => toggleComplete(h)}
                              className={`shrink-0 ${
                                h.is_completed
                                  ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                  : "bg-blue-600 hover:bg-blue-700 text-white"
                              }`}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              {h.is_completed ? "Done" : "Complete"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {getRulesForDate(selectedDate).map((r) => (
                  <div
                    key={r.id}
                    className="group relative rounded-xl border border-amber-200 transition-all duration-200 overflow-hidden hover:shadow-md"
                  >
                    <div className="flex">
                      <div className="w-1.5 shrink-0 bg-amber-500" />
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                Court Rule
                              </span>
                            </div>
                            <h4 className="font-semibold text-sm text-gray-900">{r.title}</h4>
                            {r.court && <p className="text-xs text-gray-500 mt-0.5">{r.court}</p>}
                            {r.description && <p className="text-xs text-gray-600 mt-2">{r.description}</p>}
                          </div>
                          <button
                            onClick={() => deleteRule(r.id)}
                            className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {getEventsForDate(selectedDate).map((e) => (
                  <div
                    key={e.id}
                    className="group relative rounded-xl border border-emerald-200 transition-all duration-200 overflow-hidden hover:shadow-md"
                  >
                    <div className="flex">
                      <div className="w-1.5 shrink-0 bg-emerald-500" />
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                Event
                              </span>
                            </div>
                            <h4 className="font-semibold text-sm text-gray-900">{e.title}</h4>
                            {e.time && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <Clock className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-600">{e.time}</span>
                              </div>
                            )}
                            {e.location && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <MapPin className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-600">{e.location}</span>
                              </div>
                            )}
                            {e.description && <p className="text-xs text-gray-600 mt-2">{e.description}</p>}
                          </div>
                          <button
                            onClick={() => deleteEvent(e.id)}
                            className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Modal open={showHearingModal} onClose={() => { setShowHearingModal(false); setSelectedClientId(""); setClientSearch(""); }} title="Schedule New Hearing">
        <form onSubmit={handleAddHearing} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Client *</label>
            <div className="relative" data-client-dropdown>
              <Input
                placeholder="Search client..."
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setShowClientDropdown(true);
                  if (selectedClientId) {
                    setSelectedClientId("");
                    setNewHearing((prev) => ({ ...prev, case_id: "" }));
                  }
                }}
                onFocus={() => setShowClientDropdown(true)}
              />
              {showClientDropdown && clientSearch && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {clients
                    .filter((c) => c.full_name.toLowerCase().includes(clientSearch.toLowerCase()))
                    .slice(0, 10)
                    .map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                          selectedClientId === client.id ? "bg-indigo-50 text-indigo-600" : ""
                        }`}
                        onClick={() => {
                          setSelectedClientId(client.id);
                          setClientSearch(client.full_name);
                          setShowClientDropdown(false);
                          setNewHearing((prev) => ({ ...prev, case_id: "" }));
                        }}
                      >
                        {client.full_name}
                      </button>
                    ))}
                  {clients.filter((c) => c.full_name.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 && (
                    <p className="px-3 py-2 text-sm text-gray-500">No clients found</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Case *</label>
            <Select
              options={[
                { value: "", label: selectedClientId ? "Select a case" : "Select a client first" },
                ...cases
                  .filter((c) => selectedClientId && c.client_id === selectedClientId)
                  .map((c) => ({ value: c.id, label: `${c.case_number} - ${c.title}` })),
              ]}
              value={newHearing.case_id}
              onChange={(e) => setNewHearing((prev) => ({ ...prev, case_id: e.target.value }))}
              disabled={!selectedClientId}
              required
            />
            {selectedClientId && cases.filter((c) => c.client_id === selectedClientId).length === 0 && (
              <p className="text-xs text-gray-500">No cases found for this client</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date & Time *</label>
            <Input
              type="datetime-local"
              value={newHearing.hearing_date}
              onChange={(e) => setNewHearing((prev) => ({ ...prev, hearing_date: e.target.value }))}
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
                onChange={(e) => setNewHearing((prev) => ({ ...prev, judge_name: e.target.value }))}
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

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowHearingModal(false); setSelectedClientId(""); setClientSearch(""); }}>
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Schedule Hearing
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={showRuleModal} onClose={() => { setShowRuleModal(false); setNewRule({ title: "", description: "", date: "", court: "", color: RULE_COLORS[0] }); }} title="Add Court Rule">
        <form onSubmit={handleAddRule} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title *</label>
            <Input
              placeholder="e.g., Filing deadline, Discovery cutoff"
              value={newRule.title}
              onChange={(e) => setNewRule((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date *</label>
            <Input
              type="date"
              value={newRule.date}
              onChange={(e) => setNewRule((prev) => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Court</label>
            <Input
              placeholder="e.g., Supreme Court of India"
              value={newRule.court}
              onChange={(e) => setNewRule((prev) => ({ ...prev, court: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Additional details about this rule..."
              value={newRule.description}
              onChange={(e) => setNewRule((prev) => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Color</label>
            <div className="flex gap-2">
              {RULE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewRule((prev) => ({ ...prev, color }))}
                  className={`h-8 w-8 rounded-full transition-transform ${
                    newRule.color === color ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowRuleModal(false); setNewRule({ title: "", description: "", date: "", court: "", color: RULE_COLORS[0] }); }}>
              Cancel
            </Button>
            <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white">
              Add Rule
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={showEventModal} onClose={() => { setShowEventModal(false); setNewEvent({ title: "", description: "", date: "", time: "", location: "", color: EVENT_COLORS_OPTIONS[0] }); }} title="Add Event">
        <form onSubmit={handleAddEvent} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title *</label>
            <Input
              placeholder="e.g., Client meeting, Deposition prep"
              value={newEvent.title}
              onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date *</label>
              <Input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent((prev) => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time</label>
              <Input
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent((prev) => ({ ...prev, time: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Location</label>
            <Input
              placeholder="e.g., Office, Courtroom, Zoom link"
              value={newEvent.location}
              onChange={(e) => setNewEvent((prev) => ({ ...prev, location: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Additional details about this event..."
              value={newEvent.description}
              onChange={(e) => setNewEvent((prev) => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Color</label>
            <div className="flex gap-2">
              {EVENT_COLORS_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewEvent((prev) => ({ ...prev, color }))}
                  className={`h-8 w-8 rounded-full transition-transform ${
                    newEvent.color === color ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowEventModal(false); setNewEvent({ title: "", description: "", date: "", time: "", location: "", color: EVENT_COLORS_OPTIONS[0] }); }}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white">
              Add Event
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <CalendarContent />
    </Suspense>
  );
}
