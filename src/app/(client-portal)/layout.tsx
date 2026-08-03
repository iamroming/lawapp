"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  CreditCard,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Scale,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { toast } from "react-hot-toast"
import { ThemeProvider } from "@/components/theme-provider"

const navItems = [
  { href: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/client/cases", label: "My Cases", icon: Briefcase },
  { href: "/client/documents", label: "Documents", icon: FileText },
  { href: "/client/payments", label: "Payments", icon: CreditCard },
  { href: "/client/messages", label: "Messages", icon: MessageSquare },
]

export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [clientName, setClientName] = useState("Client")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/client-login")
          return
        }
        const { data: profile } = await supabase
          .from("client_portal_users")
          .select("client_id, clients(full_name)")
          .eq("user_id", user.id)
          .single()
        if (profile?.clients) {
          setClientName((profile.clients as any).full_name || "Client")
        }
      } catch {
        // use default name
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [supabase, router])

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success("Logged out successfully")
    router.push("/client-login")
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <ThemeProvider>
      <div className="flex h-screen bg-[var(--background)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform bg-[var(--surface)] shadow-lg transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between border-b px-6 py-5">
            <Link href="/client/dashboard" className="flex items-center gap-2">
              <Scale className="h-7 w-7 text-primary" />
              <span className="text-xl font-bold text-[var(--text-primary)]">LawXP</span>
            </Link>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5 text-[var(--text-secondary)]" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* User & Logout */}
          <div className="border-t px-3 py-4">
            <div className="mb-2 px-3">
              <p className="text-sm font-medium text-[var(--text-primary)]">{clientName}</p>
              <p className="text-xs text-[var(--text-secondary)]">Client</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-[var(--text-secondary)]"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center border-b bg-[var(--surface)] px-3 py-2.5 shadow-sm lg:px-6 h-14 lg:h-auto">
          <button
            className="mr-3 lg:hidden p-1"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6 text-[var(--text-secondary)]" />
          </button>
          <div className="flex-1" />
          <span className="text-sm text-[var(--text-secondary)]">Client Portal</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
    </ThemeProvider>
  )
}
