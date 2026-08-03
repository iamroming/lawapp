"use client";
import React from "react";

interface DonutChartProps {
  data: { label: string; value: number; color?: string }[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({ data, size = 200, centerLabel, centerValue }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return <div className="text-gray-400 text-sm text-center py-8">No data</div>;

  const colors = ["#2563eb", "#dc2626", "#059669", "#d97706", "#7c3aed", "#ec4899", "#06b6d4", "#8b5cf6"];
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  const segments = data.map((d, i) => {
    const percent = d.value / total;
    const dashArray = `${percent * circumference} ${circumference}`;
    const dashOffset = -accumulated * circumference;
    accumulated += percent;
    return { ...d, percent, dashArray, dashOffset, color: d.color || colors[i % colors.length] };
  });

  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          {segments.map((s, i) => (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={size / 5}
              strokeDasharray={s.dashArray}
              strokeDashoffset={s.dashOffset}
              className="transition-all"
            />
          ))}
        </svg>
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && <span className="text-2xl font-bold">{centerValue}</span>}
            {centerLabel && <span className="text-xs text-gray-500">{centerLabel}</span>}
          </div>
        )}
      </div>
      <div className="space-y-2">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-sm text-gray-600">{s.label}</span>
            <span className="text-sm font-medium">{s.value.toLocaleString()}</span>
            <span className="text-xs text-gray-400">({Math.round(s.percent * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
