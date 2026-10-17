import type { ReactNode } from "react";

type DataTableProps = {
  loading: boolean;
  columns: string[];
  columnClassNames?: string[];
  wrapClassName?: string;
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
};

export function DataTable({
  loading,
  columns,
  columnClassNames,
  wrapClassName,
  isEmpty,
  emptyMessage,
  children,
}: DataTableProps) {
  const wrapClasses = ["studio-card", "board-table-wrap", wrapClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={wrapClasses}>
      {loading ? (
        <p className="muted board-table-loading">Loading…</p>
      ) : (
        <table className="board-table">
          <thead>
            <tr>
              {columns.map((label, index) => (
                <th
                  key={label}
                  className={columnClassNames?.[index] ?? undefined}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isEmpty ? (
              <tr>
                <td colSpan={columns.length} className="board-table-empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
