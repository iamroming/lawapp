"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Receipt,
  Activity,
  Briefcase,
  FileText,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  Crown,
  ChevronLeft,
  Database,
  Shield,
  BookOpen,
  IndianRupee,
  Ticket,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const superAdminNav = [
  { name: "Command Center", href: "/super-admin", icon: Crown },
  { name: "All Users", href: "/super-admin/users", icon: Users },
  { name: "All Cases", href: "/super-admin/cases", icon: Briefcase },
  { name: "All Clients", href: "/super-admin/clients", icon: Users },
  { name: "Subscriptions", href: "/super-admin/subscriptions", icon: Receipt },
  { name: "Coupons", href: "/super-admin/coupons", icon: Ticket },
  { name: "Revenue", href: "/super-admin/revenue", icon: IndianRupee },
  { name: "Activity Logs", href: "/super-admin/activity", icon: Activity },
  { name: "Documents", href: "/super-admin/documents", icon: FileText },
  { name: "Platform Settings", href: "/super-admin/settings", icon: Settings },
];

export function SuperAdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-gray-900 to-gray-800 px-3 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileOpen(true)} className="text-white hover:text-gray-300 p-1 -ml-1">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2 ml-2">
            <Crown className="h-5 w-5 text-yellow-400" />
            <span className="font-bold text-white">Super Admin</span>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-gray-900 text-white shadow-lg">
            <div className="flex items-center justify-between h-14 px-4 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-yellow-400" />
                <span className="font-bold">Super Admin</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
              {superAdminNav.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/super-admin" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 mb-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to App
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:text-red-300 hover:bg-gray-800"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-gray-900 text-white">
        <div className="flex items-center gap-2 h-16 px-6 border-b border-gray-700">
          <Crown className="h-6 w-6 text-yellow-400" />
          <span className="font-bold text-xl">Super Admin</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {superAdminNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/super-admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-700 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to App
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:text-red-300 hover:bg-gray-800"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
