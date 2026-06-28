import { FileText } from "lucide-react";

interface Column<T> {
  key: string;
  header: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  emptyMessage = "No data yet",
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="bg-white border border-border rounded-2xl p-12 text-center">
        <FileText className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-30" />
        <p className="text-sm text-text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-background">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-5 py-3"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr
                key={i}
                className="border-b border-border last:border-b-0 hover:bg-background/50 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-3.5 text-sm">
                    {col.render
                      ? col.render(item)
                      : String(item[col.key] ?? "")}
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
