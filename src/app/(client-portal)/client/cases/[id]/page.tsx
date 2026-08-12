"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Briefcase,
  FileText,
  Calendar,
  DollarSign,
  Clock,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { formatDate, formatCurrency } from "@/lib/utils"
import { useUser } from "@/hooks/use-user";

interface CaseDetail {
  id: string
  case_number: string
  title: string
  description: string | null
  status: string
  court_name: string | null
  judge_name: string | null
  next_hearing: string | null
  created_at: string
}

interface Hearing {
  id: string
  hearing_date: string
  court_name: string
  purpose: string | null
  result: string | null
}

interface CaseDocument {
  id: string
  title: string
  file_url: string
  created_at: string
}

interface Payment {
  id: string
  amount: number
  status: string
  created_at: string
  description: string | null
}

export default function ClientCaseDetailPage() {
  const { user: appUser } = useUser();
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [caseData, setCaseData] = useState<CaseDetail | null>(null)
  const [hearings, setHearings] = useState<Hearing[]>([])
  const [documents, setDocuments] = useState<CaseDocument[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadCase() {
      try {
        if (!appUser) return

        const { data: caseInfo } = await supabase
          .from("cases")
          .select("*")
          .eq("id", id)
          .eq("client_id", appUser?.uuid)
          .single()

        if (!caseInfo) {
          router.push("/client/cases")
          return
        }
        setCaseData(caseInfo)

        const [hearingsRes, docsRes, payRes] = await Promise.all([
          supabase
            .from("hearings")
            .select("id, hearing_date, court_name, purpose, result")
            .eq("case_id", id)
            .order("hearing_date", { ascending: false }),
          supabase
            .from("documents")
            .select("id, title, file_url, created_at")
            .eq("case_id", id)
            .order("created_at", { ascending: false }),
          supabase
            .from("payments")
            .select("id, amount, status, created_at, description")
            .eq("case_id", id)
            .order("created_at", { ascending: false }),
        ])

        if (hearingsRes.data) setHearings(hearingsRes.data)
        if (docsRes.data) setDocuments(docsRes.data)
        if (payRes.data) setPayments(payRes.data)
      } catch {
        router.push("/client/cases")
      } finally {
        setLoading(false)
      }
    }
    loadCase()
  }, [id, supabase, router])

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

  if (!caseData) return null

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/client/cases")}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Cases
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{caseData.title}</h1>
            <p className="text-[var(--text-secondary)]">{caseData.case_number}</p>
          </div>
          <Badge className={statusColor(caseData.status)}>{caseData.status}</Badge>
        </div>
      </div>

      {/* Case Info */}
      <Card className="p-5">
        <h2 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">Case Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Court</p>
            <p className="font-medium text-[var(--text-primary)]">{caseData.court_name || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Judge</p>
            <p className="font-medium text-[var(--text-primary)]">{caseData.judge_name || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Next Hearing</p>
            <p className="font-medium text-[var(--text-primary)]">
              {caseData.next_hearing ? formatDate(caseData.next_hearing) : "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Filed On</p>
            <p className="font-medium text-[var(--text-primary)]">{formatDate(caseData.created_at)}</p>
          </div>
        </div>
        {caseData.description && (
          <div className="mt-4">
            <p className="text-sm text-[var(--text-secondary)]">Description</p>
            <p className="mt-1 text-[var(--text-primary)]">{caseData.description}</p>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Hearing Timeline */}
        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
            <Calendar className="h-5 w-5" /> Hearing Timeline
          </h2>
          {hearings.length === 0 ? (
            <p className="py-4 text-center text-sm text-[var(--text-secondary)]">No hearings recorded.</p>
          ) : (
            <div className="space-y-4">
              {hearings.map((h, i) => (
                <div key={h.id} className="relative pl-6">
                  {i < hearings.length - 1 && (
                    <div className="absolute left-2 top-2 h-full w-0.5 bg-[var(--border)]" />
                  )}
                  <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-primary bg-[var(--surface)]" />
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{formatDate(h.hearing_date)}</p>
                      {h.result && (
                        <Badge className="bg-green-100 text-green-800">Completed</Badge>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">{h.court_name}</p>
                    {h.purpose && <p className="mt-1 text-xs text-[var(--text-secondary)]">{h.purpose}</p>}
                    {h.result && (
                      <p className="mt-2 rounded bg-green-50 p-2 text-xs text-green-700">
                        {h.result}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Financial Summary */}
        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
            <DollarSign className="h-5 w-5" /> Financial Summary
          </h2>
          {payments.length === 0 ? (
            <p className="py-4 text-center text-sm text-[var(--text-secondary)]">No payments recorded.</p>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {p.description || "Payment"}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">{formatDate(p.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {formatCurrency(p.amount)}
                    </p>
                    <Badge
                      className={
                        p.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {p.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Documents */}
      <Card className="p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
          <FileText className="h-5 w-5" /> Documents
        </h2>
        {documents.length === 0 ? (
          <p className="py-4 text-center text-sm text-[var(--text-secondary)]">No documents available.</p>
        ) : (
          <div className="space-y-2">
            {documents.map((d) => (
              <a
                key={d.id}
                href={d.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-[var(--surface-subtle)]"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-[var(--text-tertiary)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{d.title}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{formatDate(d.created_at)}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  View
                </Button>
              </a>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
