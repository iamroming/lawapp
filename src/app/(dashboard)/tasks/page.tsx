"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Plus, CheckSquare, ArrowRight, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { dbWrite } from "@/lib/db-write";
import { useUser } from "@/hooks/use-user";

const COLUMNS = [
  { key: "todo", label: "To Do", color: "bg-[var(--surface-subtle)] text-[var(--text-primary)]" },
  { key: "in_progress", label: "In Progress", color: "bg-[var(--surface-accent)] text-[var(--text-accent)]" },
  { key: "review", label: "Review", color: "bg-yellow-100 text-yellow-700" },
  { key: "done", label: "Done", color: "bg-green-100 text-green-700" },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-[var(--surface-subtle)] text-[var(--text-secondary)]",
  medium: "bg-[var(--surface-accent)] text-[var(--text-accent)]",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const STATUS_ORDER = ["todo", "in_progress", "review", "done"];

export default function TasksPage() {
  const { user: appUser } = useUser();
  const [tasks, setTasks] = useState<any[]>([]);
  const [filterPriority, setFilterPriority] = useState("all");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    setLoading(true);
    if (!appUser) { setLoading(false); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, firm_id")
      .eq("id", appUser?.uuid)
      .single();

    const isOwner = profile?.role === "owner" || profile?.role === "partner" || profile?.role === "super_admin";
    const firmId = profile?.firm_id || appUser?.uuid;

    let query = supabase
      .from("tasks")
      .select("*, cases(id, title, case_number, firm_id), clients(id, full_name), assigned_user:profiles!tasks_assigned_to_fkey(full_name)")
      .order("created_at", { ascending: false });

    if (isOwner) {
      query = query.eq("firm_id", firmId);
    } else {
      query = query.or(`assigned_to.eq.${appUser?.uuid},created_by.eq.${appUser?.uuid}`);
    }

    const { data } = await query;
    if (data) setTasks(data);
    setLoading(false);
  };

  const moveTask = async (taskId: string, newStatus: string) => {
    await dbWrite("tasks", "update", { status: newStatus }, { id: taskId });
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    await dbWrite("tasks", "delete", undefined, { id });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const filteredTasks = tasks.filter((t) => filterPriority === "all" || t.priority === filterPriority);

  const nextStatus = (current: string) => {
    const idx = STATUS_ORDER.indexOf(current);
    return idx < STATUS_ORDER.length - 1 ? STATUS_ORDER[idx + 1] : null;
  };

  const formatDue = (d: string | null) => {
    if (!d) return null;
    const due = new Date(d);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / 86400000);
    if (diff < 0) return <Badge className="bg-red-100 text-red-700">Overdue</Badge>;
    if (diff === 0) return <Badge className="bg-orange-100 text-orange-700">Due today</Badge>;
    if (diff <= 3) return <Badge className="bg-yellow-100 text-yellow-700">Due in {diff}d</Badge>;
    return <span className="text-xs text-[var(--text-tertiary)]">{d}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><CheckSquare className="h-6 w-6" /> Tasks</h1>
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: "all", label: "All Priorities" },
              { value: "urgent", label: "Urgent" },
              { value: "high", label: "High" },
              { value: "medium", label: "Medium" },
              { value: "low", label: "Low" },
            ]}
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-40"
          />
          <Link href="/tasks/new"><Button><Plus className="h-4 w-4 mr-2" /> New Task</Button></Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key}>
                <div className={`rounded-lg p-3 mb-3 ${col.color} font-semibold text-sm flex items-center justify-between`}>
                  <span>{col.label}</span>
                  <span className="text-xs opacity-70">{colTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {colTasks.map((task) => (
                    <Card key={task.id} className="shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-sm leading-tight">{task.title}</p>
                          <button onClick={() => deleteTask(task.id)} className="text-[var(--text-tertiary)] hover:text-red-500 ml-1">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        {task.cases?.case_number && (
                          <p className="text-xs text-[var(--text-accent)] mb-1">Case: {task.cases.case_number}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <Badge className={PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
                          {formatDue(task.due_date)}
                        </div>
                        {task.assigned_user?.full_name && (
                          <p className="text-xs text-[var(--text-secondary)] mt-2">Assigned: {task.assigned_user.full_name}</p>
                        )}
                        {nextStatus(task.status) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2 text-xs"
                            onClick={() => moveTask(task.id, nextStatus(task.status)!)}
                          >
                            Move to {COLUMNS.find((c) => c.key === nextStatus(task.status))?.label}
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {colTasks.length === 0 && (
                    <p className="text-xs text-[var(--text-tertiary)] text-center py-4">No tasks</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
