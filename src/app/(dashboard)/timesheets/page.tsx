"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Plus, Timer, Play, Pause, Trash2, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function TimesheetsPage() {
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [activeTimer, setActiveTimer] = useState<any>(null);
  const [timerCaseId, setTimerCaseId] = useState("");
  const [timerDesc, setTimerDesc] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (activeTimer) {
      const start = new Date(activeTimer.started_at).getTime();
      const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
      tick();
      timerRef.current = setInterval(tick, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    } else {
      setElapsed(0);
    }
  }, [activeTimer]);

  const fetchData = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    const [tsRes, casesRes, timerRes] = await Promise.all([
      supabase.from("timesheets").select("*, cases(id, title, case_number)").order("worked_date", { ascending: false }).limit(50),
      supabase.from("cases").select("id, title, case_number"),
      supabase.from("active_timers").select("*, cases(id, title, case_number)").eq("user_id", user?.id || "").single(),
    ]);
    if (tsRes.data) setTimesheets(tsRes.data);
    if (casesRes.data) setCases(casesRes.data);
    if (timerRes.data) setActiveTimer(timerRes.data);
    setLoading(false);
  };

  const startTimer = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("active_timers").delete().eq("user_id", user.id);
    const { data } = await supabase.from("active_timers").insert({
      user_id: user.id,
      case_id: timerCaseId || null,
      description: timerDesc || null,
    }).select("*, cases(id, title, case_number)").single();
    if (data) setActiveTimer(data);
  };

  const stopTimer = async () => {
    if (!activeTimer) return;
    const start = new Date(activeTimer.started_at).getTime();
    const hours = Math.round(((Date.now() - start) / 3600000) * 100) / 100;
    if (hours <= 0) { await supabase.from("active_timers").delete().eq("id", activeTimer.id); setActiveTimer(null); return; }

    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("firm_id").eq("id", user?.id || "").single();

    await supabase.from("timesheets").insert({
      user_id: user?.id,
      case_id: activeTimer.case_id,
      firm_id: profile?.firm_id || null,
      description: activeTimer.description,
      hours,
      worked_date: new Date().toISOString().split("T")[0],
    });
    await supabase.from("active_timers").delete().eq("id", activeTimer.id);
    setActiveTimer(null);
    fetchData();
  };

  const deleteTimesheet = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    await supabase.from("timesheets").delete().eq("id", id);
    fetchData();
  };

  const totalHours = timesheets.reduce((sum, t) => sum + (t.hours || 0), 0);
  const billableHours = timesheets.filter((t) => t.is_billable).reduce((sum, t) => sum + (t.hours || 0), 0);

  const caseOptions = [{ value: "", label: "No case" }, ...cases.map((c) => ({ value: c.id, label: `${c.case_number} - ${c.title}` }))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Timer className="h-6 w-6" /> Timesheets</h1>
        <Link href="/timesheets/new"><Button><Plus className="h-4 w-4 mr-2" /> Log Time</Button></Link>
      </div>

      {/* Timer */}
      <Card className={activeTimer ? "border-green-500 bg-green-50" : ""}>
        <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Timer {activeTimer && <Badge className="bg-green-600">Running</Badge>}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-mono font-bold">{formatDuration(elapsed)}</div>
            <div className="flex-1 space-y-2">
              <Select
                options={caseOptions}
                value={timerCaseId}
                onChange={(e) => setTimerCaseId(e.target.value)}
              />
              <input value={timerDesc} onChange={(e) => setTimerDesc(e.target.value)} placeholder="Description (optional)" className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-2">
              {!activeTimer ? (
                <Button onClick={startTimer} className="bg-green-600 hover:bg-green-700"><Play className="h-4 w-4 mr-2" /> Start</Button>
              ) : (
                <Button onClick={stopTimer} className="bg-red-600 hover:bg-red-700"><Pause className="h-4 w-4 mr-2" /> Stop</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-[var(--text-secondary)]">Total Hours</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-[var(--text-secondary)]">Billable Hours</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-600">{billableHours.toFixed(1)}h</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-[var(--text-secondary)]">Entries</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{timesheets.length}</p></CardContent></Card>
      </div>

      {/* Timesheet List */}
      <Card>
        <CardContent className="p-0">
          {loading ? <div className="p-8 text-center text-[var(--text-secondary)]">Loading...</div> : timesheets.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-secondary)]">
              <Timer className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No time entries yet</p>
              <Link href="/timesheets/new"><Button className="mt-2" size="sm"><Plus className="h-4 w-4 mr-2" /> Log First Entry</Button></Link>
            </div>
          ) : (
            <div className="divide-y">
              {timesheets.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 hover:bg-[var(--surface-subtle)]">
                  <div className="flex-1">
                    <p className="font-medium">{t.description || "Time entry"}</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {t.cases?.case_number && <span className="mr-3">Case: {t.cases.case_number}</span>}
                      <span>{t.worked_date}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={t.is_billable ? "default" : "outline"}>{t.hours}h</Badge>
                    {t.is_billable && <Badge className="bg-green-100 text-green-700">Billable</Badge>}
                    <Button variant="ghost" size="sm" onClick={() => deleteTimesheet(t.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
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
