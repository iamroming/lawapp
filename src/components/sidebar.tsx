"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  FileText,
  Receipt,
  Brain,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Scale,
  Shield,
  Globe,
  MessageSquare,
  Wallet,
  CheckSquare,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Search,
  Building2,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { createClient } from "@/lib/supabase/client";
import { getFirebaseAuth } from "@/lib/firebase/config";
import { signOut as firebaseSignOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { firebaseUidToUuid } from "@/lib/firebase/uid";
import { BranchSwitcher } from "@/components/branch-switcher";

interface NavGroup {
  label: string;
  items: typeof allNavItems;
}

const EMPLOYEE_ROLES = ["senior_associate", "associate", "junior_associate", "paralegal", "intern", "office_admin"];

const allNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["owner","partner","senior_associate","associate","junior_associate","paralegal","intern","office_admin","super_admin"] },
  { name: "Cases", href: "/cases", icon: Briefcase, roles: ["owner","partner","senior_associate","associate","junior_associate","paralegal","intern","office_admin"] },
  { name: "Clients", href: "/clients", icon: Users, roles: ["owner","partner","senior_associate","associate","junior_associate","paralegal","office_admin"] },
  { name: "Calendar", href: "/calendar", icon: Calendar, roles: ["owner","partner","senior_associate","associate","junior_associate","paralegal","intern","office_admin"] },
  { name: "Court Tracking", href: "/court-tracking", icon: Globe, roles: ["owner","partner","senior_associate","associate","junior_associate"] },
  { name: "Documents", href: "/documents", icon: FileText, roles: ["owner","partner","senior_associate","associate","junior_associate","paralegal","office_admin"] },
  { name: "Billing", href: "/billing", icon: Receipt, roles: ["owner","partner","senior_associate","associate","office_admin"], ownerOnly: true },
  { name: "Quotations", href: "/quotations", icon: ClipboardList, roles: ["owner","partner","senior_associate","associate","office_admin"], ownerOnly: true },
  { name: "Expenses", href: "/expenses", icon: Wallet, roles: ["owner","partner","senior_associate","associate","junior_associate","paralegal"], ownerOnly: true },
  { name: "Tasks", href: "/tasks", icon: CheckSquare, roles: ["owner","partner","senior_associate","associate","junior_associate","paralegal","intern","office_admin"] },
  { name: "Branches", href: "/branches", icon: Building2, roles: ["owner","partner"], plans: ["firm", "enterprise"] },
  { name: "AI Tools", href: "/ai", icon: Brain, roles: ["owner","partner","senior_associate","associate","junior_associate"], ownerOnly: true },
  { name: "Reports", href: "/reports", icon: BarChart3, roles: ["owner","partner","senior_associate"], ownerOnly: true },
  { name: "CRM", href: "/crm", icon: ClipboardList, roles: ["owner","partner","senior_associate","associate"], ownerOnly: true },
  { name: "Messages", href: "/messages", icon: MessageSquare, roles: ["owner","partner","senior_associate","associate","junior_associate","paralegal","intern","office_admin"] },
  { name: "Subscription", href: "/subscription", icon: Receipt, roles: ["owner","partner","senior_associate","associate","junior_associate","paralegal","intern","office_admin"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["owner","partner","senior_associate","associate","junior_associate","paralegal","intern","office_admin"] },
];

function buildGroups(userRole: string | null, planSlug?: string): NavGroup[] {
  const has = (roles: string[]) => !userRole || roles.includes(userRole);
  const hasPlan = (plans?: string[]) => !plans || !planSlug || plans.includes(planSlug);
  const isEmployee = userRole ? EMPLOYEE_ROLES.includes(userRole) : false;
  const filter = (items: typeof allNavItems) =>
    items.filter(i => has(i.roles) && hasPlan((i as any).plans) && !(isEmployee && (i as any).ownerOnly));

  const groups: NavGroup[] = [];

  const main = filter(allNavItems.filter(i => ["/dashboard", "/cases", "/clients", "/calendar"].includes(i.href)));
  if (main.length) groups.push({ label: "", items: main });

  const tools = filter(allNavItems.filter(i => ["/court-tracking", "/documents", "/billing", "/quotations", "/expenses", "/tasks", "/branches"].includes(i.href)));
  if (tools.length) groups.push({ label: "Tools", items: tools });

  const advanced = filter(allNavItems.filter(i => ["/ai", "/reports", "/crm"].includes(i.href)));
  if (advanced.length) groups.push({ label: "Advanced", items: advanced });

  const system = filter(allNavItems.filter(i => ["/messages", "/subscription", "/settings"].includes(i.href)));
  if (system.length) groups.push({ label: "", items: system });

  return groups;
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [firmName, setFirmName] = useState<string>("CaseFiles");
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>("free");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAdmin = async () => {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("role, firm_name")
          .eq("id", firebaseUidToUuid(user.uid))
          .single();
        if (data?.role) {
          setUserRole(data.role);
        }
        if (data?.firm_name) {
          setFirmName(data.firm_name);
        }

        // Check subscription plan
        const { data: subData } = await supabase
          .from("user_subscriptions")
          .select("notes")
          .eq("user_id", firebaseUidToUuid(user.uid))
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        
        if (subData?.notes) {
          try {
            const notes = JSON.parse(subData.notes);
            if (notes.plan_slug) {
              setSubscriptionPlan(notes.plan_slug);
            }
          } catch {}
        }
      }
    };
    checkAdmin();
  }, [supabase]);

  const canAccessAdmin = (userRole === "owner" || userRole === "partner") && subscriptionPlan !== "solo";
  const groups = buildGroups(userRole, subscriptionPlan);

  const toggleGroup = (label: string) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const isGroupActive = (items: typeof allNavItems) =>
    items.some(item => pathname === item.href || pathname.startsWith(item.href + "/"));

  const handleLogout = async () => {
    await firebaseSignOut(getFirebaseAuth());
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  };

  const renderNav = (isMobile = false) => (
    <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
      {groups.map((group) => {
        const open = isMobile ? !collapsed[group.label] : !collapsed[group.label];
        const active = isGroupActive(group.items);

        if (!group.label) {
          return group.items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => isMobile && setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-[var(--accent)] text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.name}
              </Link>
            );
          });
        }

        return (
          <div key={group.label} className="mb-1">
            <button
              onClick={() => toggleGroup(group.label)}
              className={cn(
                "flex items-center justify-between w-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-colors",
                active ? "text-[var(--accent)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              )}
            >
              {group.label}
              {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
            {open && group.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => isMobile && setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 pl-5 pr-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-[var(--accent)] text-white shadow-sm"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        );
      })}
      {canAccessAdmin && (
        <div className="mt-2 pt-2 border-t border-[var(--border)]">
          <BranchSwitcher />
        </div>
      )}
      {canAccessAdmin && (
        <div className="mt-2 pt-2 border-t border-[var(--border)]">
          <Link
            href="/admin"
            onClick={() => isMobile && setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
              pathname.startsWith("/admin")
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]"
            )}
          >
            <Shield className="h-4 w-4 shrink-0" />
            Owner Panel
          </Link>
        </div>
      )}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[var(--surface)] border-b border-[var(--border)] px-3 h-14 flex items-center shadow-sm">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 -ml-1"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/dashboard" className="ml-3 flex items-center gap-2">
          <Scale className="h-5 w-5 text-[var(--accent)]" />
          <span className="font-bold text-base text-[var(--text-primary)]">{firmName}</span>
        </Link>
        <div className="flex-1" />
        <Link
          href="/dashboard"
          className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Link>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-[var(--surface)] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between h-14 px-4 border-b border-[var(--border)] shrink-0">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-[var(--accent)]" />
                <span className="font-bold text-base text-[var(--text-primary)]">{firmName}</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 -mr-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {renderNav(true)}
            <div className="p-4 border-t border-[var(--border)] shrink-0 space-y-3">
              <LanguageSwitcher />
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[var(--surface)] border-r border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-2 h-14 px-5 border-b border-[var(--border)]">
          <Scale className="h-5 w-5 text-[var(--accent)]" />
          <span className="font-bold text-base text-[var(--text-primary)]">{firmName}</span>
        </div>
        {renderNav()}
        <div className="p-4 border-t border-[var(--border)]">
          <div className="mb-3">
            <LanguageSwitcher />
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Mobile bottom nav - shown below lg breakpoint */}
      <MobileBottomNav onMoreClick={() => setMobileOpen(true)} />
    </>
  );
}
