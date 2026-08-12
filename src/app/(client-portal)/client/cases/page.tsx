"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Briefcase, Search, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { formatDate } from "@/lib/utils"
import { useUser } from "@/hooks/use-user";

interface Case {
  id: string
  case_number: string
  title: string
  status: string
  next_hearing: string | null
  court_name: string | null
  created_at: string
}

export default function ClientCasesPage() {
  const { user: appUser } = useUser();
  const [cases, setCases] = useState<Case[]>([])
  const [filtered, setFiltered] = useState<Case[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadCases() {
      try {
        if (!appUser) return

        const { data } = await supabase
          .from("cases")
          .select("id, case_number, title, status, next_hearing, court_name, created_at")
          .eq("client_id", appUser?.uuid)
          .order("created_at", { ascending: false })

        if (data) {
          setCases(data)
          setFiltered(data)
        }
      } catch {
        // handle error
      } finally {
        setLoading(false)
      }
    }
    loadCases()
  }, [supabase])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      cases.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.case_number.toLowerCase().includes(q)
      )
    )
  }, [search, cases])

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
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Cases</h1>
        <p className="text-[var(--text-secondary)]">View and track all your cases.</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <Input
          placeholder="Search cases..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <Briefcase className="mb-3 h-12 w-12 text-[var(--text-tertiary)]" />
          <p className="text-[var(--text-secondary)]">No cases found.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <Link key={c.id} href={`/client/cases/${c.id}`}>
              <Card className="flex items-center justify-between p-4 transition-colors hover:bg-[var(--surface-subtle)]">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{c.title}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{c.case_number}</p>
                    {c.next_hearing && (
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        Next hearing: {formatDate(c.next_hearing)}
                        {c.court_name ? ` at ${c.court_name}` : ""}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={statusColor(c.status)}>{c.status}</Badge>
                  <ChevronRight className="h-5 w-5 text-[var(--text-tertiary)]" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
