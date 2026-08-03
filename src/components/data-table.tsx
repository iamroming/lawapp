import React from "react";

export function DataTable({
  columns,
  data,
  emptyMessage = "No data available",
}: {
  columns: { key: string; label: string; className?: string; render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode }[];
  data: Record<string, unknown>[];
  emptyMessage?: string;
}) {
  if (!data.length) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-[var(--text-secondary)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--surface-subtle)] border-b border-[var(--border)]">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider ${col.className || ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-[var(--surface-subtle)] transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-sm text-[var(--text-primary)] ${col.className || ""}`}>
                    {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
