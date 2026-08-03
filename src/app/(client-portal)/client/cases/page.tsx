"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Briefcase, Search, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { formatDate } from "@/lib/utils"

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
  const [cases, setCases] = useState<Case[]>([])
  const [filtered, setFiltered] = useState<Case[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadCases() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
          .from("cases")
          .select("id, case_number, title, status, next_hearing, court_name, created_at")
          .eq("client_id", user.id)
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
      case "closed": return "bg-gray-100 text-gray-800"
      default: return "bg-blue-100 text-blue-800"
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
        <h1 className="text-2xl font-bold text-gray-900">My Cases</h1>
        <p className="text-gray-500">View and track all your cases.</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search cases..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <Briefcase className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">No cases found.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <Link key={c.id} href={`/client/cases/${c.id}`}>
              <Card className="flex items-center justify-between p-4 transition-colors hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{c.title}</p>
                    <p className="text-sm text-gray-500">{c.case_number}</p>
                    {c.next_hearing && (
                      <p className="mt-1 text-xs text-gray-500">
                        Next hearing: {formatDate(c.next_hearing)}
                        {c.court_name ? ` at ${c.court_name}` : ""}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={statusColor(c.status)}>{c.status}</Badge>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
