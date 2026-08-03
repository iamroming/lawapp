"use client";
import React from "react";

interface LineChartProps {
  data: { label: string; value: number }[];
  forecast?: { label: string; value: number }[];
  height?: number;
  color?: string;
  showDots?: boolean;
}

export function LineChart({ data, forecast, height = 200, color = "#2563eb", showDots = true }: LineChartProps) {
  const allValues = [...data.map((d) => d.value), ...(forecast || []).map((f) => f.value)];
  const max = Math.max(...allValues, 1);
  const padding = 40;
  const chartWidth = 600;
  const chartHeight = height;

  const points = data.map((d, i) => ({
    x: padding + (i / Math.max(data.length - 1, 1)) * (chartWidth - padding * 2),
    y: chartHeight - padding - (d.value / max) * (chartHeight - padding * 2),
    label: d.label,
    value: d.value,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = pathD + ` L ${points[points.length - 1]?.x || 0} ${chartHeight - padding} L ${points[0]?.x || 0} ${chartHeight - padding} Z`;

  let forecastPoints: { x: number; y: number; label: string; value: number }[] = [];
  let forecastPathD = "";
  if (forecast && forecast.length > 0) {
    const startIndex = data.length - 1;
    forecastPoints = forecast.map((f, i) => ({
      x: padding + ((startIndex + i + 1) / Math.max(allValues.length - 1, 1)) * (chartWidth - padding * 2),
      y: chartHeight - padding - (f.value / max) * (chartHeight - padding * 2),
      label: f.label,
      value: f.value,
    }));
    const startPt = points[points.length - 1] || { x: padding, y: chartHeight - padding };
    forecastPathD = `M ${startPt.x} ${startPt.y} ` + forecastPoints.map((p) => `L ${p.x} ${p.y}`).join(" ");
  }

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ minWidth: 400 }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <g key={pct}>
            <line
              x1={padding} y1={chartHeight - padding - pct * (chartHeight - padding * 2)}
              x2={chartWidth - padding} y2={chartHeight - padding - pct * (chartHeight - padding * 2)}
              stroke="#e5e7eb" strokeWidth={1}
            />
            <text x={padding - 5} y={chartHeight - padding - pct * (chartHeight - padding * 2) + 4} textAnchor="end" className="text-xs fill-gray-400">
              {Math.round(max * pct).toLocaleString()}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaD} fill={color} opacity={0.1} />

        {/* Main line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Forecast line (dashed) */}
        {forecastPathD && (
          <path d={forecastPathD} fill="none" stroke="#9ca3af" strokeWidth={2} strokeDasharray="6 4" strokeLinecap="round" />
        )}

        {/* Dots */}
        {showDots && points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill="white" stroke={color} strokeWidth={2} />
            <title>{`${p.label}: ${p.value.toLocaleString()}`}</title>
          </g>
        ))}

        {/* Forecast dots */}
        {showDots && forecastPoints.map((p, i) => (
          <g key={`f-${i}`}>
            <circle cx={p.x} cy={p.y} r={4} fill="white" stroke="#9ca3af" strokeWidth={2} strokeDasharray="2 2" />
            <title>{`${p.label}: ${p.value.toLocaleString()} (predicted)`}</title>
          </g>
        ))}

        {/* X-axis labels */}
        {points.filter((_, i) => i % Math.ceil(points.length / 8) === 0 || i === points.length - 1).map((p, i) => (
          <text key={i} x={p.x} y={chartHeight - 5} textAnchor="middle" className="text-xs fill-gray-400">
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
