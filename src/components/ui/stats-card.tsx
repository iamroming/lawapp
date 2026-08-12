import * as React from "react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

export function StatsCard({ title, value, description, icon, trend, trendValue, className }: StatsCardProps) {
  return (
    <div className={cn("rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[var(--text-tertiary)]">{title}</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
          {description && <p className="text-xs text-[var(--text-tertiary)]">{description}</p>}
        </div>
        {icon && <div className="text-[var(--text-tertiary)]">{icon}</div>}
      </div>
      {trend && trendValue && (
        <div className="mt-2">
          <span
            className={cn(
              "text-xs font-medium",
              trend === "up" && "text-green-500",
              trend === "down" && "text-red-500",
              trend === "neutral" && "text-[var(--text-tertiary)]"
            )}
          >
            {trend === "up" && "↑"}
            {trend === "down" && "↓"} {trendValue}
          </span>
        </div>
      )}
    </div>
  );
}
