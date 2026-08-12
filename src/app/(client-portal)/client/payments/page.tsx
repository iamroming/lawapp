"use client"

import { useEffect, useState } from "react"
import { CreditCard, Receipt, CheckCircle, Clock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { formatDate, formatCurrency } from "@/lib/utils"
import { RazorpayButton } from "@/components/payment/razorpay-button"
import { useUser } from "@/hooks/use-user";

interface Invoice {
  id: string
  amount: number
  status: string
  description: string | null
  due_date: string | null
  created_at: string
  case_title: string | null
}

export default function ClientPaymentsPage() {
  const { user: appUser } = useUser();
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadInvoices() {
      try {
        if (!appUser) return

        const { data } = await supabase
          .from("invoices")
          .select("id, amount, status, description, due_date, created_at, case_title")
          .eq("client_id", appUser?.uuid)
          .order("created_at", { ascending: false })

        if (data) setInvoices(data)
      } catch {
        // handle error
      } finally {
        setLoading(false)
      }
    }
    loadInvoices()
  }, [supabase])

  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amount, 0)

  const totalPending = invoices
    .filter((i) => i.status === "pending" || i.status === "sent" || i.status === "overdue")
    .reduce((sum, i) => sum + i.amount, 0)

  function statusIcon(status: string) {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Receipt className="h-4 w-4 text-[var(--text-secondary)]" />
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
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Payments</h1>
        <p className="text-[var(--text-secondary)]">View invoices and payment history.</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2.5">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Total Paid</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{formatCurrency(totalPaid)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2.5">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Pending Amount</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{formatCurrency(totalPending)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Invoices */}
      <Card className="p-5">
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Invoices</h2>
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <Receipt className="mb-3 h-12 w-12 text-[var(--text-tertiary)]" />
            <p className="text-[var(--text-secondary)]">No invoices yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  {statusIcon(inv.status)}
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">
                      {inv.description || "Invoice"}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {inv.case_title || "General"}
                      {inv.due_date ? ` · Due ${formatDate(inv.due_date)}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-[var(--text-primary)]">{formatCurrency(inv.amount)}</p>
                    <Badge
                      className={
                        inv.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {inv.status}
                    </Badge>
                  </div>
                  {inv.status !== "paid" && (
                    <RazorpayButton
                      invoiceId={inv.id}
                      amount={inv.amount}
                      onSuccess={() => {
                        setInvoices((prev) =>
                          prev.map((i) => (i.id === inv.id ? { ...i, status: "paid" } : i))
                        )
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
