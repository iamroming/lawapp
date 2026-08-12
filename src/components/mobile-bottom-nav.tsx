"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  CheckSquare,
  MoreHorizontal,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const primaryNav: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Cases", href: "/cases", icon: Briefcase },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "More", href: "/dashboard#menu", icon: MoreHorizontal },
];

export function MobileBottomNav({ onMoreClick }: { onMoreClick?: () => void }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/dashboard#menu") return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)] border-t border-[var(--border)] safe-area-bottom shadow-lg">
      <div className="flex items-center justify-around h-16 px-1">
        {primaryNav.map((item) => {
          const active = isActive(item.href);
          const isMore = item.href === "/dashboard#menu";

          if (isMore && onMoreClick) {
            return (
              <button
                key={item.label}
                onClick={onMoreClick}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-0",
                  "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-0 transition-colors",
                active
                  ? "text-[var(--accent)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
