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
  BookOpen,
  Calculator,
  Bell,
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
  Clock,
  Wallet,
  Timer,
  CheckSquare,
  Sparkles,
  MessageCircle,
  FileSearch,
  ClipboardList,
  CalendarCheck,
  ListOrdered,
  IndianRupee,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

interface NavGroup {
  label: string;
  items: typeof allNavItems;
}

const allNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["owner","partner","senior_associate","associate","junior_associate","paralegal","intern","office_admin","super_admin"] },
  { name: "Cases", href: "/cases", icon: Briefcase, roles: ["owner","partner","senior_associate","associate","junior_associate","paralegal","intern","office_admin"] },
  { name: "Clients", href: "/clients", icon: Users, roles: ["owner","partner","senior_associate","associate","junior_associate","paralegal","office_admin"] },
  { name: "Calendar", href: "/calendar", icon: Calendar, roles: ["owner","partner","senior_associate","associate","junior_associate","paralegal","intern","office_admin"] },
  { name: "eCourts Tracking", href: "/ecourts", icon: Globe, roles: ["owner","partner","senior_associate","associate","junior_associate"] },
  { name: "Cause List", href: "/cause-list", icon: ListOrdered, roles: ["owner","partner","senior_associate","associate","junior_associate"] },
  { name: "Court Research", href: "/research", icon: Scale, roles: ["owner","partner","senior_associate","associate","junior_associate","paralegal","intern"] },
  { name: "Documents", href: "/documents", icon: FileText, roles: ["owner","partner","senior_associate","associate","junior_associate","paralegal","office_admin"] },
  { name: "Templates", href: "/documents/templates", icon: FileText, roles: ["owner","partner","senior_associate","associate"] },
  { name: "Billing", href: "/billing", icon: Receipt, roles: ["owner","partner","senior_associate","associate","office_admin"] },
  { name: "Outstanding", href: "/billing/outstanding", icon: IndianRupee, roles: ["owner","partner","senior_associate","associate","office_admin"] },
  { name: "Collections", href: "/billing/collections", icon: IndianRupee, roles: ["owner","partner","senior_associate","associate","office_admin"] },
  { name: "Expenses", href: "/expenses", icon: Wallet, roles: ["owner","partner","senior_associate","associate","junior_associate","paralegal"] },
  { name: "Timesheets", href: "/timesheets", icon: Timer, roles: ["owner","partner","senior_associate","associate","junior_associate","paralegal","intern"] },
  { name: "Tasks", href: "/tasks", icon: CheckSquare, roles: ["owner","partner","senior_associate","associate","junior_associate","paralegal","intern","office_admin"] },
  { name: "Reminders", href: "/reminders", icon: Clock, roles: ["owner","partner","senior_associate","associate","junior_associate","paralegal","intern"] },
  { name: "Bare Acts", href: "/bare-acts", icon: BookOpen, roles: ["owner","partner","senior_associate","associate","junior_associate","paralegal","intern"] },
  { name: "Calculators", href: "/calculators", icon: Calculator, roles: ["owner","partner","senior_associate","associate","junior_associate","paralegal","intern"] },
  { name: "Notifications", href: "/notifications", icon: Bell, roles: ["owner","partner","senior_associate","associate","junior_associate","paralegal","intern","office_admin"] },
  { name: "AI Assistant", href: "/ai/case-analysis", icon: Brain, roles: ["owner","partner","senior_associate","associate","junior_associate"] },
  { name: "AI Drafting", href: "/ai/drafting", icon: Sparkles, roles: ["owner","partner","senior_associate","associate"] },
  { name: "AI Chat", href: "/ai/chat", icon: MessageCircle, roles: ["owner","partner","senior_associate","associate","junior_associate"] },
  { name: "AI Summarize", href: "/ai/summarize", icon: FileSearch, roles: ["owner","partner","senior_associate","associate"] },
  { name: "Consultations", href: "/consultations", icon: CalendarCheck, roles: ["owner","partner","senior_associate","associate"] },
  { name: "Intake Forms", href: "/intake", icon: ClipboardList, roles: ["owner","partner","senior_associate","associate"] },
  { name: "Reports", href: "/reports", icon: BarChart3, roles: ["owner","partner","senior_associate"] },
  { name: "Financial Analytics", href: "/reports/financial", icon: IndianRupee, roles: ["owner","partner"] },
  { name: "Team Analytics", href: "/reports/team", icon: Users, roles: ["owner","partner"] },
  { name: "Client Analytics", href: "/reports/clients-deep", icon: Users, roles: ["owner","partner"] },
  { name: "Messages", href: "/messages", icon: MessageSquare, roles: ["owner","partner","senior_associate","associate","junior_associate","paralegal","intern","office_admin"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["owner","partner","senior_associate","associate","junior_associate","paralegal","intern","office_admin"] },
];

function buildGroups(userRole: string | null): NavGroup[] {
  const has = (roles: string[]) => !userRole || roles.includes(userRole);
  const filter = (items: typeof allNavItems) => items.filter(i => has(i.roles));

  const groups: NavGroup[] = [];

  const main = filter(allNavItems.filter(i => i.href === "/dashboard"));
  if (main.length) groups.push({ label: "", items: main });

  const practice = filter(allNavItems.filter(i => ["/cases", "/clients", "/calendar"].includes(i.href)));
  if (practice.length) groups.push({ label: "Practice", items: practice });

  const court = filter(allNavItems.filter(i => ["/ecourts", "/cause-list", "/research"].includes(i.href)));
  if (court.length) groups.push({ label: "Court", items: court });

  const docs = filter(allNavItems.filter(i => ["/documents", "/documents/templates"].includes(i.href)));
  if (docs.length) groups.push({ label: "Documents", items: docs });

  const billing = filter(allNavItems.filter(i => ["/billing", "/billing/outstanding", "/billing/collections", "/expenses"].includes(i.href)));
  if (billing.length) groups.push({ label: "Billing", items: billing });

  const work = filter(allNavItems.filter(i => ["/timesheets", "/tasks", "/reminders"].includes(i.href)));
  if (work.length) groups.push({ label: "Work", items: work });

  const research = filter(allNavItems.filter(i => ["/bare-acts", "/calculators"].includes(i.href)));
  if (research.length) groups.push({ label: "Research", items: research });

  const ai = filter(allNavItems.filter(i => i.href.startsWith("/ai/")));
  if (ai.length) groups.push({ label: "AI Tools", items: ai });

  const crm = filter(allNavItems.filter(i => ["/consultations", "/intake", "/messages"].includes(i.href)));
  if (crm.length) groups.push({ label: "CRM", items: crm });

  const reports = filter(allNavItems.filter(i => i.href.startsWith("/reports")));
  if (reports.length) groups.push({ label: "Reports", items: reports });

  const system = filter(allNavItems.filter(i => ["/notifications", "/settings"].includes(i.href)));
  if (system.length) groups.push({ label: "System", items: system });

  return groups;
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (data?.role) {
          setUserRole(data.role);
        }
      }
    };
    checkAdmin();
  }, [supabase]);

  const canAccessAdmin = userRole === "owner" || userRole === "partner";
  const groups = buildGroups(userRole);

  const toggleGroup = (label: string) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const isGroupActive = (items: typeof allNavItems) =>
    items.some(item => pathname === item.href || pathname.startsWith(item.href + "/"));

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
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
                "flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors",
                active ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {group.label}
              {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
            {open && group.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => isMobile && setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 pl-6 pr-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
        <div className="mt-2 pt-2 border-t border-gray-100">
          <Link
            href="/admin"
            onClick={() => isMobile && setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith("/admin")
                ? "bg-red-50 text-red-700"
                : "text-red-600 hover:bg-red-50 hover:text-red-700"
            )}
          >
            <Shield className="h-5 w-5 shrink-0" />
            Owner Panel
          </Link>
        </div>
      )}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-3 h-14 flex items-center">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-gray-600 hover:text-gray-900 p-1 -ml-1"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <Link href="/dashboard" className="ml-3 flex items-center gap-2">
          <Scale className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-lg">LawXP</span>
        </Link>
        <div className="flex-1" />
        <Link
          href="/dashboard"
          className="p-2 text-gray-500 hover:text-gray-700"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Link>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between h-14 px-4 border-b shrink-0">
              <div className="flex items-center gap-2">
                <Scale className="h-6 w-6 text-blue-600" />
                <span className="font-bold text-lg">LawXP</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 -mr-1 text-gray-500 hover:text-gray-700"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderNav(true)}
            <div className="p-4 border-t shrink-0 space-y-3">
              <LanguageSwitcher />
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
        <div className="flex items-center gap-2 h-16 px-6 border-b">
          <Scale className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-xl">LawXP</span>
        </div>
        {renderNav()}
        <div className="p-4 border-t">
          <div className="mb-3">
            <LanguageSwitcher />
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Mobile bottom nav - shown below lg breakpoint */}
      <MobileBottomNav onMoreClick={() => setMobileOpen(true)} />
    </>
  );
}
