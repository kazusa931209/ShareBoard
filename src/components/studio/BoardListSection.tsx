"use client";

import { useCallback, useEffect, useState } from "react";
import { BoardDrawer, type BoardFormValues } from "@/components/studio/BoardDrawer";
import {
  DataTable,
  FilterKeywordField,
  FilterResetSearch,
  FilterToolbar,
  TablePagination,
} from "@/components/shared";
import { commitPageInput } from "@/components/shared/pagination";
import { Button, ErrorMessage } from "@/components/ui";
import type { BoardRow, BoardSearchField, LikeFilter } from "@/lib/boards";
import { formatBoardDateTime, truncateText } from "@/lib/format";

const BOARD_TABLE_COLUMN_CLASSES = [
  "board-col-no",
  "board-col-title",
  "board-col-url",
  "board-col-content",
  "board-col-other",
  "board-col-poster",
  "board-col-like",
  "board-col-datetime",
  "board-col-actions",
] as const;

const TEXT_PREVIEW_LENGTH = 200;

type ListResponse = {
  items: BoardRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type FilterState = {
  keyword: string;
  keywordField: BoardSearchField;
  dateFrom: string;
  dateTo: string;
  likeFilter: LikeFilter;
};

const defaultFilters: FilterState = {
  keyword: "",
  keywordField: "title",
  dateFrom: "",
  dateTo: "",
  likeFilter: "all",
};

export type BoardListSectionProps = {
  currentUserId: string;
  showAddPost?: boolean;
};

export function BoardListSection({
  currentUserId,
  showAddPost = true,
}: BoardListSectionProps) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [applied, setApplied] = useState<FilterState>(defaultFilters);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pageInput, setPageInput] = useState("1");

  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"add" | "edit">("add");
  const [editingRow, setEditingRow] = useState<BoardRow | null>(null);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchBoards = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      keywordField: applied.keywordField,
      likeFilter: applied.likeFilter,
    });
    if (applied.keyword.trim()) {
      params.set("keyword", applied.keyword.trim());
    }
    if (applied.dateFrom) {
      params.set("dateFrom", applied.dateFrom);
    }
    if (applied.dateTo) {
      params.set("dateTo", applied.dateTo);
    }

    try {
      const res = await fetch(`/api/boards?${params.toString()}`);
      const json = (await res.json()) as ListResponse & { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Failed to load board.");
        setLoading(false);
        return;
      }
      setData(json);
      setPageInput(String(json.page));
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [applied, page, pageSize]);

  useEffect(() => {
    void fetchBoards();
  }, [fetchBoards]);

  function handleSearch() {
    setApplied(filters);
    setPage(1);
    setPageInput("1");
  }

  function handleReset() {
    setFilters(defaultFilters);
    setApplied(defaultFilters);
    setPage(1);
    setPageInput("1");
    setPageSize(20);
  }

  function goToPage(next: number) {
    const totalPages = data?.totalPages ?? 1;
    const safe = Math.min(Math.max(1, next), totalPages);
    setPage(safe);
    setPageInput(String(safe));
  }

  function openAdd() {
    setDrawerMode("add");
    setEditingRow(null);
    setDrawerError(null);
    setDrawerOpen(true);
  }

  function openEdit(row: BoardRow) {
    setDrawerMode("edit");
    setEditingRow(row);
    setDrawerError(null);
    setDrawerOpen(true);
  }

  async function submitDrawer(values: BoardFormValues) {
    setDrawerError(null);
    setSaving(true);
    const payload = {
      title: values.title,
      url: values.url || undefined,
      content: values.content,
      other: values.other || undefined,
    };

    try {
      const res =
        drawerMode === "add"
          ? await fetch("/api/boards", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/boards/${editingRow?.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setDrawerError(json.error ?? "Save failed.");
        setSaving(false);
        return;
      }

      setDrawerOpen(false);
      setSaving(false);
      await fetchBoards();
    } catch {
      setDrawerError("Network error.");
      setSaving(false);
    }
  }

  async function handleDelete(row: BoardRow) {
    if (!confirm("Mark this post as deleted?")) {
      return;
    }
    const res = await fetch(`/api/boards/${row.id}`, { method: "DELETE" });
    if (res.ok) {
      await fetchBoards();
    }
  }

  async function toggleLike(row: BoardRow) {
    if (row.isDeleted) {
      return;
    }
    await fetch(`/api/boards/${row.id}/like`, { method: "POST" });
    await fetchBoards();
  }

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? page;

  return (
    <>
      <FilterToolbar
        trailing={
          showAddPost ? (
            <div className="board-filter-item board-filter-add-post">
              <span
                className="board-filter-label board-filter-label--spacer"
                aria-hidden="true"
              >
                &nbsp;
              </span>
              <Button type="button" onClick={openAdd}>Add Post</Button>
            </div>
          ) : undefined
        }
      >
          <FilterKeywordField
            value={filters.keyword}
            onChange={(keyword) =>
              setFilters((f) => ({ ...f, keyword }))
            }
          />
          <label className="board-filter-item">
            <span className="board-filter-label">Search in</span>
            <select
              value={filters.keywordField}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  keywordField: e.target.value as BoardSearchField,
                }))
              }
            >
              <option value="title">Title</option>
              <option value="content">Content</option>
              <option value="other">Other</option>
              <option value="poster">Poster User ID</option>
            </select>
          </label>
          <label className="board-filter-item">
            <span className="board-filter-label">Date from</span>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) =>
                setFilters((f) => ({ ...f, dateFrom: e.target.value }))
              }
            />
          </label>
          <label className="board-filter-item">
            <span className="board-filter-label">Date to</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) =>
                setFilters((f) => ({ ...f, dateTo: e.target.value }))
              }
            />
          </label>
          <label className="board-filter-item">
            <span className="board-filter-label">Like filter</span>
            <select
              value={filters.likeFilter}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  likeFilter: e.target.value as LikeFilter,
                }))
              }
            >
              <option value="all">All</option>
              <option value="like">Like</option>
              <option value="not_yet">Not Yet</option>
            </select>
          </label>
          <FilterResetSearch onReset={handleReset} onSearch={handleSearch} />
      </FilterToolbar>

      <ErrorMessage message={error} />

      <DataTable
        loading={loading}
        wrapClassName="board-table-wrap--list"
        columnClassNames={[...BOARD_TABLE_COLUMN_CLASSES]}
        columns={[
          "No",
          "Title",
          "URL",
          "Content",
          "Other",
          "Poster",
          "Like",
          "Post DateTime",
          "Actions",
        ]}
        isEmpty={items.length === 0}
        emptyMessage="No records found."
      >
                {items.map((row, index) => {
                  const rowNo = (currentPage - 1) * pageSize + index + 1;
                  const isOwner =
                    row.posterUserId.toLowerCase() ===
                    currentUserId.toLowerCase();
                  return (
                    <tr
                      key={row.id}
                      className={row.isDeleted ? "board-row--deleted" : undefined}
                    >
                      <td className={BOARD_TABLE_COLUMN_CLASSES[0]}>
                        {rowNo}
                      </td>
                      <td
                        className={`${BOARD_TABLE_COLUMN_CLASSES[1]} board-cell-title`}
                      >
                        {row.title}
                      </td>
                      <td
                        className={`${BOARD_TABLE_COLUMN_CLASSES[2]} board-cell-url`}
                      >
                        {row.url ? (
                          <a href={row.url} target="_blank" rel="noreferrer">
                            {row.url}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td
                        className={`${BOARD_TABLE_COLUMN_CLASSES[3]} board-cell-text`}
                        title={
                          row.content.length > TEXT_PREVIEW_LENGTH
                            ? row.content
                            : undefined
                        }
                      >
                        {truncateText(row.content, TEXT_PREVIEW_LENGTH)}
                      </td>
                      <td
                        className={`${BOARD_TABLE_COLUMN_CLASSES[4]} board-cell-text`}
                        title={
                          row.other && row.other.length > TEXT_PREVIEW_LENGTH
                            ? row.other
                            : undefined
                        }
                      >
                        {row.other
                          ? truncateText(row.other, TEXT_PREVIEW_LENGTH)
                          : "—"}
                      </td>
                      <td className={BOARD_TABLE_COLUMN_CLASSES[5]}>
                        {row.posterUserId}
                      </td>
                      <td
                        className={`${BOARD_TABLE_COLUMN_CLASSES[6]} board-cell-like`}
                      >
                        <div className="board-like-cell">
                          <button
                            type="button"
                            className={
                              row.likedByMe
                                ? "board-like-block-btn board-like-block-btn--on"
                                : "board-like-block-btn"
                            }
                            disabled={row.isDeleted || isOwner}
                            onClick={() => void toggleLike(row)}
                            title={
                              isOwner
                                ? "You cannot like your own post"
                                : row.likedByMe
                                  ? "Remove your like"
                                  : "Like this post"
                            }
                          >
                            <svg
                              className="board-like-block-btn-icon"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                                fill={
                                  row.likedByMe ? "currentColor" : "none"
                                }
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span>{row.likedByMe ? "Liked" : "Like"}</span>
                          </button>
                          <span className="board-like-users muted">
                            {row.likedUserIds.join(", ") || "—"}
                          </span>
                        </div>
                      </td>
                      <td className={BOARD_TABLE_COLUMN_CLASSES[7]}>
                        {formatBoardDateTime(row.postDatetime)}
                      </td>
                      <td
                        className={`${BOARD_TABLE_COLUMN_CLASSES[8]} board-cell-actions`}
                      >
                        {isOwner && !row.isDeleted ? (
                          <>
                            <Button
                              type="button"
                              className="btn-ghost board-btn-sm"
                              onClick={() => openEdit(row)}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              className="board-btn-sm"
                              onClick={() => void handleDelete(row)}
                            >
                              Delete
                            </Button>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
      </DataTable>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        total={data?.total ?? 0}
        pageSize={pageSize}
        pageInput={pageInput}
        loading={loading}
        onPrev={() => goToPage(currentPage - 1)}
        onNext={() => goToPage(currentPage + 1)}
        onPageInputChange={setPageInput}
        onPageInputCommit={() =>
          commitPageInput(pageInput, currentPage, goToPage, setPageInput)
        }
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
          setPageInput("1");
        }}
      />

      <BoardDrawer
        open={drawerOpen}
        mode={drawerMode}
        initial={editingRow}
        saving={saving}
        error={drawerError}
        onClose={() => setDrawerOpen(false)}
        onSubmit={(values) => void submitDrawer(values)}
      />
    </>
  );
}
