"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DataTable,
  FilterKeywordField,
  FilterResetSearch,
  FilterToolbar,
  TablePagination,
} from "@/components/shared";
import { commitPageInput } from "@/components/shared/pagination";
import { Button, ErrorMessage } from "@/components/ui";

type ShareUser = {
  userId: string;
  shared: boolean;
};

type ListResponse = {
  users: ShareUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function ShareWithPanel() {
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pageInput, setPageInput] = useState("1");

  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (appliedKeyword.trim()) {
      params.set("keyword", appliedKeyword.trim());
    }

    try {
      const res = await fetch(`/api/share-with/users?${params.toString()}`);
      const json = (await res.json()) as ListResponse & { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Failed to load users.");
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
  }, [appliedKeyword, page, pageSize]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  function handleSearch() {
    setAppliedKeyword(keyword);
    setPage(1);
    setPageInput("1");
  }

  function handleReset() {
    setKeyword("");
    setAppliedKeyword("");
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

  async function toggleShare(targetUserId: string, nextShared: boolean) {
    setUpdatingUserId(targetUserId);
    setError(null);

    const previous = data;
    if (data) {
      setData({
        ...data,
        users: data.users.map((u) =>
          u.userId === targetUserId ? { ...u, shared: nextShared } : u,
        ),
      });
    }

    try {
      const res = await fetch(
        `/api/share-with/users/${encodeURIComponent(targetUserId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shared: nextShared }),
        },
      );
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        if (previous) {
          setData(previous);
        }
        setError(json.error ?? "Could not update share setting.");
      }
    } catch {
      if (previous) {
        setData(previous);
      }
      setError("Network error.");
    } finally {
      setUpdatingUserId(null);
    }
  }

  const users = data?.users ?? [];
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? page;

  return (
    <div className="board-page stack">
      <FilterToolbar>
        <FilterKeywordField
          value={keyword}
          onChange={setKeyword}
          placeholder="User ID…"
        />
        <FilterResetSearch onReset={handleReset} onSearch={handleSearch} />
      </FilterToolbar>

      <ErrorMessage message={error} />

      <DataTable
        loading={loading}
        columns={["No", "User ID", "Shared", "Action"]}
        isEmpty={users.length === 0}
        emptyMessage="No users found."
      >
        {users.map((user, index) => {
          const rowNo = (currentPage - 1) * pageSize + index + 1;
          return (
            <tr key={user.userId}>
              <td>{rowNo}</td>
              <td>{user.userId}</td>
              <td className={user.shared ? "share-status--on" : "share-status--off"}>
                {user.shared ? "Shared" : "Not shared"}
              </td>
              <td className="share-action-cell">
                {user.shared ? (
                  <Button
                    type="button"
                    variant="danger"
                    className="share-toggle-btn"
                    disabled={updatingUserId === user.userId}
                    onClick={() => void toggleShare(user.userId, false)}
                  >
                    {updatingUserId === user.userId ? "…" : "Not Share"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="share-toggle-btn"
                    disabled={updatingUserId === user.userId}
                    onClick={() => void toggleShare(user.userId, true)}
                  >
                    {updatingUserId === user.userId ? "…" : "Share"}
                  </Button>
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
    </div>
  );
}
