"use client";

import { useEffect, useState } from "react";
import { Button, ErrorMessage } from "@/components/ui";
import type { BoardRow } from "@/lib/boards";

export type BoardFormValues = {
  title: string;
  url: string;
  content: string;
  other: string;
};

const emptyForm: BoardFormValues = {
  title: "",
  url: "",
  content: "",
  other: "",
};

type BoardDrawerProps = {
  open: boolean;
  mode: "add" | "edit";
  initial?: BoardRow | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: BoardFormValues) => void;
};

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
    if (mode === "edit" && initial) {
      setForm({
        title: initial.title,
        url: initial.url ?? "",
        content: initial.content,
        other: initial.other ?? "",
      });
    } else {
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
      <aside className="board-drawer" aria-label={mode === "add" ? "Add post" : "Edit post"}>
        <div className="board-drawer-header">
          <h2>{mode === "add" ? "Add post" : "Edit post"}</h2>
          <button type="button" className="board-drawer-close" onClick={onClose}>
            ×
          </button>
        </div>
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
              rows={8}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            />
          </label>
          <label className="studio-field">
            <span className="studio-field-label">Other (optional)</span>
            <textarea
              maxLength={10000}
              rows={4}
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
      </aside>
    </>
  );
}
