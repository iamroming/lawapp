"use client"

import { useEffect, useState } from "react"
import { FileText, Download, Filter } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { formatDate } from "@/lib/utils"

interface Document {
  id: string
  title: string
  file_url: string
  file_type: string | null
  case_title: string | null
  created_at: string
}

export default function ClientDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filtered, setFiltered] = useState<Document[]>([])
  const [cases, setCases] = useState<{ id: string; title: string }[]>([])
  const [selectedCase, setSelectedCase] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadDocuments() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: docs } = await supabase
          .from("documents")
          .select("id, title, file_url, file_type, case_title, created_at")
          .eq("client_id", user.id)
          .order("created_at", { ascending: false })

        if (docs) {
          setDocuments(docs)
          setFiltered(docs)
        }

        const { data: caseList } = await supabase
          .from("cases")
          .select("id, title")
          .eq("client_id", user.id)

        if (caseList) setCases(caseList)
      } catch {
        // handle error
      } finally {
        setLoading(false)
      }
    }
    loadDocuments()
  }, [supabase])

  useEffect(() => {
    let result = documents
    if (selectedCase) {
      result = result.filter((d) => d.case_title === cases.find((c) => c.id === selectedCase)?.title)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((d) => d.title.toLowerCase().includes(q))
    }
    setFiltered(result)
  }, [selectedCase, search, documents, cases])

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
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Documents</h1>
        <p className="text-[var(--text-secondary)]">View and download documents shared with you.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <select
            value={selectedCase}
            onChange={(e) => setSelectedCase(e.target.value)}
            className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Cases</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
        <Input
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <FileText className="mb-3 h-12 w-12 text-[var(--text-tertiary)]" />
          <p className="text-[var(--text-secondary)]">No documents found.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => (
            <Card key={d.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2.5">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{d.title}</p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {d.case_title || "General"} · {d.file_type || "File"} · {formatDate(d.created_at)}
                  </p>
                </div>
              </div>
              <a href={d.file_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" /> Download
                </Button>
              </a>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
