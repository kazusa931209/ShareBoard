"use client";

import { Button } from "@/components/ui";

export type TablePaginationProps = {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
  pageInput: string;
  loading?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPageInputChange: (value: string) => void;
  onPageInputCommit: () => void;
  onPageSizeChange: (pageSize: number) => void;
};

export function TablePagination(props: TablePaginationProps) {
  const {
    currentPage,
    totalPages,
    total,
    pageSize,
    pageInput,
    loading = false,
    onPrev,
    onNext,
    onPageInputChange,
    onPageInputCommit,
    onPageSizeChange,
  } = props;

  return (
    <section className="studio-card board-pagination">
      <div className="board-pagination-group">
        <Button
          type="button"
          className="btn-ghost"
          disabled={currentPage <= 1 || loading}
          onClick={onPrev}
        >
          Prev
        </Button>
        <Button
          type="button"
          className="btn-ghost"
          disabled={currentPage >= totalPages || loading}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
      <div className="board-pagination-group">
        <span className="muted">Page</span>
        <input
          className="board-page-input"
          type="number"
          min={1}
          max={totalPages}
          value={pageInput}
          onChange={(e) => onPageInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onPageInputCommit();
            }
          }}
          onBlur={onPageInputCommit}
        />
        <span className="muted">
          / {totalPages} (total {total} records)
        </span>
      </div>
      <div className="board-pagination-group board-pagination-page-size">
        <span className="muted">Records per page</span>
        <select
          value={pageSize}
          onChange={(e) =>
            onPageSizeChange(Number.parseInt(e.target.value, 10))
          }
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </section>
  );
}
