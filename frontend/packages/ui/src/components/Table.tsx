import React from "react";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField?: string;
  emptyMessage?: string;
  className?: string;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  keyField = "id",
  emptyMessage = "No data available.",
  className = "",
}: TableProps<T>) {
  return (
    <div className={`overflow-x-auto rounded-lg border border-neutral-200 ${className}`}>
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600 ${col.className || ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 bg-white">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-sm text-neutral-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={String(row[keyField])} className="hover:bg-neutral-50">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-sm text-neutral-700 ${col.className || ""}`}
                  >
                    {col.render
                      ? col.render(row)
                      : (row[col.key] as React.ReactNode) ?? "—"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
