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
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronLeft,
  TrendingUp,
  Percent,
  UserPlus,
  IndianRupee,
  Sliders,
} from "lucide-react";
import { getFirebaseAuth } from "@/lib/firebase/config";
import { signOut as firebaseSignOut } from "firebase/auth";
import { useRouter } from "next/navigation";

const adminNav = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Employees", href: "/admin/employees", icon: Users },
  { name: "Add Employee", href: "/admin/add-employee", icon: UserPlus },
  { name: "Salary Management", href: "/admin/salary", icon: IndianRupee },
  { name: "Role Salary Settings", href: "/admin/salary-settings", icon: Sliders },
  { name: "Performance", href: "/admin/performance", icon: TrendingUp },
];

export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await firebaseSignOut(getFirebaseAuth());
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-3 h-14 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileOpen(true)} className="text-gray-600 hover:text-gray-900 p-1 -ml-1">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2 ml-2">
            <Shield className="h-5 w-5 text-red-500" />
            <span className="font-bold text-gray-900">Owner Panel</span>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl">
            <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-red-500" />
                <span className="font-bold text-gray-900">Owner Panel</span>
              </div>
              <button onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {adminNav.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-red-50 text-red-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 mb-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to App
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 h-16 px-6 border-b border-gray-200">
          <Shield className="h-6 w-6 text-red-500" />
          <span className="font-bold text-xl text-gray-900">Owner Panel</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {adminNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-red-50 text-red-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to App
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
