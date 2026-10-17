"use client";

import { BoardListSection } from "@/components/studio/BoardListSection";

type BoardPanelProps = {
  currentUserId: string;
};

export function BoardPanel({ currentUserId }: BoardPanelProps) {
  return (
    <div className="board-page stack">
      <BoardListSection currentUserId={currentUserId} showAddPost />
    </div>
  );
}
