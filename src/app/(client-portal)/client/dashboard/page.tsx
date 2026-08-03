"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Briefcase,
  CreditCard,
  FileText,
  Calendar,
  ArrowRight,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { formatDate, formatCurrency } from "@/lib/utils"

interface Stats {
  activeCases: number
  pendingPayments: number
  totalDocuments: number
}

interface CaseUpdate {
  id: string
  case_number: string
  title: string
  status: string
  updated_at: string
}

interface Hearing {
  id: string
  case: { title: string } | null
  hearing_date: string
  court: string
}

export default function ClientDashboardPage() {
  const [clientName, setClientName] = useState("Client")
  const [stats, setStats] = useState<Stats>({ activeCases: 0, pendingPayments: 0, totalDocuments: 0 })
  const [recentCases, setRecentCases] = useState<CaseUpdate[]>([])
  const [upcomingHearings, setUpcomingHearings] = useState<Hearing[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single()
        if (profile?.full_name) setClientName(profile.full_name.split(" ")[0])

        const { data: cases } = await supabase
          .from("cases")
          .select("id, case_number, title, status, updated_at")
          .eq("client_id", user.id)
          .order("updated_at", { ascending: false })

        if (cases) {
          setStats((s) => ({
            ...s,
            activeCases: cases.filter((c) => c.status !== "closed").length,
          }))
          setRecentCases(cases.slice(0, 5))
        }

        const { count: docCount } = await supabase
          .from("documents")
          .select("id, case:cases!inner(client_id)", { count: "exact", head: true })
          .eq("case.client_id", user.id)
        if (docCount !== null) setStats((s) => ({ ...s, totalDocuments: docCount }))

        const { count: payCount } = await supabase
          .from("invoices")
          .select("id", { count: "exact", head: true })
          .eq("client_id", user.id)
          .eq("status", "pending")
        if (payCount !== null) setStats((s) => ({ ...s, pendingPayments: payCount }))

        const { data: hearings } = await supabase
          .from("hearings")
          .select("id, case:cases!inner(title, client_id), hearing_date, court")
          .eq("case.client_id", user.id)
          .gte("hearing_date", new Date().toISOString())
          .order("hearing_date", { ascending: true })
          .limit(5)
        if (hearings) setUpcomingHearings(hearings as unknown as Hearing[])
      } catch {
        // use defaults
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [supabase])

  function statusColor(status: string) {
    switch (status) {
      case "active": return "bg-green-100 text-green-800"
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "closed": return "bg-[var(--surface-subtle)] text-[var(--text-primary)]"
      default: return "bg-[var(--surface-accent)] text-[var(--text-primary)]"
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Welcome back, {clientName}
        </h1>
        <p className="text-[var(--text-secondary)]">Here&apos;s an overview of your cases and activity.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[var(--surface-accent)] p-2.5">
              <Briefcase className="h-5 w-5 text-[var(--text-accent)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Active Cases</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.activeCases}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2.5">
              <CreditCard className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Pending Payments</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.pendingPayments}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2.5">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Documents</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.totalDocuments}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Case Updates */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Case Updates</h2>
            <Link href="/client/cases">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          {recentCases.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-secondary)]">No cases yet.</p>
          ) : (
            <div className="space-y-3">
              {recentCases.map((c) => (
                <Link
                  key={c.id}
                  href={`/client/cases/${c.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-[var(--surface-subtle)]"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{c.title}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{c.case_number}</p>
                  </div>
                  <Badge className={statusColor(c.status)}>{c.status}</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming Hearings */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Upcoming Hearings</h2>
            <Calendar className="h-5 w-5 text-[var(--text-tertiary)]" />
          </div>
          {upcomingHearings.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--text-secondary)]">No upcoming hearings.</p>
          ) : (
            <div className="space-y-3">
              {upcomingHearings.map((h) => (
                <div key={h.id} className="rounded-lg border p-3">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{h.case?.title || "Case"}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{h.court}</p>
                  <p className="mt-1 text-xs font-medium text-primary">
                    {formatDate(h.hearing_date)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
