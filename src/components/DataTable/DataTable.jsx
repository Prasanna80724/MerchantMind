import { cn } from "../../utils/cn";

export default function DataTable({ columns, data, rowKey, emptyMessage = "No data found", className }) {
  if (!data?.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[var(--shadow-soft)]", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, idx) => (
              <tr
                key={rowKey ? rowKey(row, idx) : idx}
                className="transition-colors hover:bg-slate-50/80"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3.5 text-slate-700">
                    {col.render ? col.render(row) : row[col.key]}
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
