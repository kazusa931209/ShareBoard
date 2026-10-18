"use client";

import { useEffect, useState } from "react";
import { Button, ErrorMessage } from "@/components/ui";
import type { BoardRow } from "@/lib/boards";
import { formatBoardDateTime } from "@/lib/format";

export type BoardFormValues = {
  title: string;
  url: string;
  content: string;
  other: string;
};

export type BoardDrawerMode = "add" | "edit" | "view";

const emptyForm: BoardFormValues = {
  title: "",
  url: "",
  content: "",
  other: "",
};

type BoardDrawerProps = {
  open: boolean;
  mode: BoardDrawerMode;
  initial?: BoardRow | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: BoardFormValues) => void;
};

function drawerTitle(mode: BoardDrawerMode): string {
  switch (mode) {
    case "add":
      return "Add post";
    case "edit":
      return "Edit post";
    case "view":
      return "View post";
  }
}

export function BoardDrawer({
  open,
  mode,
  initial,
  saving,
  error,
  onClose,
  onSubmit,
}: BoardDrawerProps) {
  const [form, setForm] = useState<BoardFormValues>(emptyForm);

  useEffect(() => {
    if (!open) {
      return;
    }
    if ((mode === "edit" || mode === "view") && initial) {
      setForm({
        title: initial.title,
        url: initial.url ?? "",
        content: initial.content,
        other: initial.other ?? "",
      });
    } else if (mode === "add") {
      setForm(emptyForm);
    }
  }, [open, mode, initial]);

  if (!open) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="board-drawer-backdrop"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <aside
        className="board-drawer"
        aria-label={drawerTitle(mode)}
      >
        <div className="board-drawer-header">
          <h2>{drawerTitle(mode)}</h2>
          <button type="button" className="board-drawer-close" onClick={onClose}>
            ×
          </button>
        </div>
        {mode === "view" && initial ? (
          <div className="board-drawer-body stack board-drawer-view">
            <dl className="board-view-fields">
              <div className="board-view-field">
                <dt>Title</dt>
                <dd>{initial.title}</dd>
              </div>
              <div className="board-view-field">
                <dt>URL</dt>
                <dd>
                  {initial.url ? (
                    <a href={initial.url} target="_blank" rel="noreferrer">
                      {initial.url}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="board-view-field">
                <dt>Content</dt>
                <dd className="board-view-text">{initial.content}</dd>
              </div>
              <div className="board-view-field">
                <dt>Other</dt>
                <dd className="board-view-text">{initial.other ?? "—"}</dd>
              </div>
              <div className="board-view-field">
                <dt>Poster</dt>
                <dd>{initial.posterUserId}</dd>
              </div>
              <div className="board-view-field">
                <dt>Post DateTime</dt>
                <dd>{formatBoardDateTime(initial.postDatetime)}</dd>
              </div>
              <div className="board-view-field">
                <dt>Liked by</dt>
                <dd>{initial.likedUserIds.join(", ") || "—"}</dd>
              </div>
            </dl>
            <div className="board-drawer-actions">
              <Button type="button" className="btn-ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form
            className="board-drawer-body stack"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(form);
            }}
          >
            <ErrorMessage message={error} />
            <label className="studio-field">
              <span className="studio-field-label">Title</span>
              <input
                required
                maxLength={500}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </label>
            <label className="studio-field">
              <span className="studio-field-label">URL (optional)</span>
              <input
                maxLength={2000}
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              />
            </label>
            <label className="studio-field">
              <span className="studio-field-label">Content</span>
              <textarea
                required
                maxLength={10000}
                rows={16}
                value={form.content}
                onChange={(e) =>
                  setForm((f) => ({ ...f, content: e.target.value }))
                }
              />
            </label>
            <label className="studio-field">
              <span className="studio-field-label">Other (optional)</span>
              <textarea
                maxLength={10000}
                rows={8}
                value={form.other}
                onChange={(e) => setForm((f) => ({ ...f, other: e.target.value }))}
              />
            </label>
            <div className="board-drawer-actions">
              <Button type="button" className="btn-ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : mode === "add" ? "Add" : "Save"}
              </Button>
            </div>
          </form>
        )}
      </aside>
    </>
  );
}
