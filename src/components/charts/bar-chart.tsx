"use client";
import React from "react";

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  orientation?: "horizontal" | "vertical";
  maxValue?: number;
  showValues?: boolean;
  height?: number;
}

export function BarChart({ data, orientation = "horizontal", maxValue, showValues = true, height = 200 }: BarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);
  const colors = ["#2563eb", "#7c3aed", "#dc2626", "#059669", "#d97706", "#ec4899", "#06b6d4", "#8b5cf6"];

  if (orientation === "vertical") {
    return (
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => {
          const h = max > 0 ? (d.value / max) * (height - 30) : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              {showValues && <span className="text-xs text-[var(--text-secondary)] font-medium">{d.value.toLocaleString()}</span>}
              <div
                className="w-full rounded-t-md transition-all"
                style={{ height: `${h}px`, backgroundColor: d.color || colors[i % colors.length] }}
              />
              <span className="text-xs text-[var(--text-secondary)] text-center leading-tight truncate w-full" title={d.label}>{d.label}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-sm text-[var(--text-secondary)] w-32 truncate text-right" title={d.label}>{d.label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all flex items-center justify-end pr-2"
              style={{
                width: `${max > 0 ? (d.value / max) * 100 : 0}%`,
                backgroundColor: d.color || colors[i % colors.length],
                minWidth: d.value > 0 ? "2rem" : "0",
              }}
            >
              {showValues && <span className="text-xs text-white font-medium">{d.value.toLocaleString()}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
