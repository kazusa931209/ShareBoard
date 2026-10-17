import { getDb } from "@/lib/db";
import {
  validateBoardInput,
  type BoardInput,
} from "@/lib/validation";

export type BoardRow = {
  id: number;
  title: string;
  url: string | null;
  content: string;
  other: string | null;
  posterUserId: string;
  likedUserIds: string[];
  postDatetime: string;
  isDeleted: boolean;
  likedByMe: boolean;
};

export type BoardSearchField = "title" | "content" | "other" | "poster";
export type LikeFilter = "all" | "like" | "not_yet";

export type ListBoardsParams = {
  page: number;
  pageSize: number;
  keyword?: string;
  keywordField?: BoardSearchField;
  dateFrom?: string;
  dateTo?: string;
  likeFilter?: LikeFilter;
  viewerUserDbId: number;
};

export type ListBoardsResult = {
  items: BoardRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type BoardDbRow = {
  id: number;
  title: string;
  url: string | null;
  content: string;
  other: string | null;
  poster_user_id: string;
  liked_user_ids: string | null;
  post_datetime: string;
  is_deleted: number;
  liked_by_me: number;
};

const VIEWER_ACCESS_SQL = `(b.user_id = ? OR EXISTS (
  SELECT 1 FROM share_with s
  WHERE s.owner_user_id = b.user_id AND s.target_user_id = ?
))`;

function viewerCanAccessBoard(
  posterUserDbId: number,
  viewerUserDbId: number,
): boolean {
  if (posterUserDbId === viewerUserDbId) {
    return true;
  }
  const db = getDb();
  const row = db
    .prepare(
      `
      SELECT 1 FROM share_with
      WHERE owner_user_id = ? AND target_user_id = ?
    `,
    )
    .get(posterUserDbId, viewerUserDbId);
  return Boolean(row);
}

function mapRow(row: BoardDbRow): BoardRow {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    content: row.content,
    other: row.other,
    posterUserId: row.poster_user_id,
    likedUserIds: row.liked_user_ids
      ? row.liked_user_ids.split(",").filter(Boolean)
      : [],
    postDatetime: row.post_datetime,
    isDeleted: row.is_deleted === 1,
    likedByMe: row.liked_by_me === 1,
  };
}

function buildListQuery(params: ListBoardsParams): {
  where: string;
  bindings: (string | number)[];
} {
  const conditions: string[] = ["1=1"];
  const bindings: (string | number)[] = [];

  conditions.push(VIEWER_ACCESS_SQL);
  bindings.push(params.viewerUserDbId, params.viewerUserDbId);

  const keyword = params.keyword?.trim();
  if (keyword) {
    const pattern = `%${keyword}%`;
    switch (params.keywordField ?? "title") {
      case "title":
        conditions.push("b.title LIKE ? COLLATE NOCASE");
        bindings.push(pattern);
        break;
      case "content":
        conditions.push("b.content LIKE ? COLLATE NOCASE");
        bindings.push(pattern);
        break;
      case "other":
        conditions.push("b.other LIKE ? COLLATE NOCASE");
        bindings.push(pattern);
        break;
      case "poster":
        conditions.push("u.user_id LIKE ? COLLATE NOCASE");
        bindings.push(pattern);
        break;
      default:
        break;
    }
  }

  if (params.dateFrom) {
    conditions.push("b.post_datetime >= ?");
    bindings.push(`${params.dateFrom} 00:00:00`);
  }
  if (params.dateTo) {
    conditions.push("b.post_datetime <= ?");
    bindings.push(`${params.dateTo} 23:59:59`);
  }

  if (params.likeFilter === "like") {
    conditions.push(
      `EXISTS (SELECT 1 FROM likes lk WHERE lk.board_id = b.id AND lk.user_id = ?)`,
    );
    bindings.push(params.viewerUserDbId);
  } else if (params.likeFilter === "not_yet") {
    conditions.push(
      `NOT EXISTS (SELECT 1 FROM likes lk WHERE lk.board_id = b.id AND lk.user_id = ?)`,
    );
    bindings.push(params.viewerUserDbId);
  }

  return { where: conditions.join(" AND "), bindings };
}

const SELECT_BODY = `
  SELECT
    b.id,
    b.title,
    b.url,
    b.content,
    b.other,
    b.post_datetime,
    b.is_deleted,
    u.user_id AS poster_user_id,
    (
      SELECT GROUP_CONCAT(u2.user_id, ',')
      FROM likes lk
      INNER JOIN users u2 ON u2.id = lk.user_id
      WHERE lk.board_id = b.id
    ) AS liked_user_ids,
    EXISTS (
      SELECT 1 FROM likes lk2
      WHERE lk2.board_id = b.id AND lk2.user_id = ?
    ) AS liked_by_me
  FROM boards b
  INNER JOIN users u ON u.id = b.user_id
  WHERE
`;

export function listBoards(params: ListBoardsParams): ListBoardsResult {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const { where, bindings } = buildListQuery(params);

  const db = getDb();

  const countSql = `
    SELECT COUNT(*) AS total
    FROM boards b
    INNER JOIN users u ON u.id = b.user_id
    WHERE ${where}
  `;
  const countRow = db.prepare(countSql).get(...bindings) as { total: number };
  const total = countRow.total;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;

  const dataSql = `
    ${SELECT_BODY}
    ${where}
    ORDER BY b.is_deleted ASC, b.post_datetime DESC
    LIMIT ? OFFSET ?
  `;
  const rows = db
    .prepare(dataSql)
    .all(params.viewerUserDbId, ...bindings, pageSize, offset) as BoardDbRow[];

  return {
    items: rows.map(mapRow),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export function createBoard(
  userDbId: number,
  input: BoardInput,
): { board?: BoardRow; error?: string } {
  const err = validateBoardInput(input);
  if (err) {
    return { error: err };
  }

  const db = getDb();
  const insert = db
    .prepare(
      `
      INSERT INTO boards (user_id, title, url, content, other, post_datetime)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      RETURNING id
    `,
    )
    .get(
      userDbId,
      input.title.trim(),
      input.url?.trim() || null,
      input.content.trim(),
      input.other?.trim() || null,
    ) as { id: number };

  return getBoardById(insert.id, userDbId);
}

export function updateBoard(
  boardId: number,
  userDbId: number,
  input: BoardInput,
): { board?: BoardRow; error?: string } {
  const err = validateBoardInput(input);
  if (err) {
    return { error: err };
  }

  const db = getDb();
  const existing = db
    .prepare(
      "SELECT user_id, is_deleted FROM boards WHERE id = ?",
    )
    .get(boardId) as { user_id: number; is_deleted: number } | undefined;

  if (!existing) {
    return { error: "Board post not found." };
  }
  if (existing.user_id !== userDbId) {
    return { error: "You can only edit your own posts." };
  }
  if (existing.is_deleted === 1) {
    return { error: "Deleted posts cannot be edited." };
  }

  db.prepare(
    `
    UPDATE boards
    SET title = ?, url = ?, content = ?, other = ?, updated_at = datetime('now')
    WHERE id = ?
  `,
  ).run(
    input.title.trim(),
    input.url?.trim() || null,
    input.content.trim(),
    input.other?.trim() || null,
    boardId,
  );

  return getBoardById(boardId, userDbId);
}

export function softDeleteBoard(
  boardId: number,
  userDbId: number,
): { ok: boolean; error?: string } {
  const db = getDb();
  const existing = db
    .prepare("SELECT user_id, is_deleted FROM boards WHERE id = ?")
    .get(boardId) as { user_id: number; is_deleted: number } | undefined;

  if (!existing) {
    return { ok: false, error: "Board post not found." };
  }
  if (existing.user_id !== userDbId) {
    return { ok: false, error: "You can only delete your own posts." };
  }
  if (existing.is_deleted === 1) {
    return { ok: true };
  }

  db.prepare(
    `UPDATE boards SET is_deleted = 1, updated_at = datetime('now') WHERE id = ?`,
  ).run(boardId);
  return { ok: true };
}

export function toggleBoardLike(
  boardId: number,
  userDbId: number,
): { liked: boolean; error?: string } {
  const db = getDb();
  const board = db
    .prepare("SELECT id, user_id, is_deleted FROM boards WHERE id = ?")
    .get(boardId) as
    | { id: number; user_id: number; is_deleted: number }
    | undefined;

  if (!board) {
    return { liked: false, error: "Board post not found." };
  }
  if (!viewerCanAccessBoard(board.user_id, userDbId)) {
    return { liked: false, error: "Board post not found." };
  }
  if (board.is_deleted === 1) {
    return { liked: false, error: "Cannot like a deleted post." };
  }
  if (board.user_id === userDbId) {
    return { liked: false, error: "You cannot like your own post." };
  }

  const existing = db
    .prepare("SELECT id FROM likes WHERE board_id = ? AND user_id = ?")
    .get(boardId, userDbId) as { id: number } | undefined;

  if (existing) {
    db.prepare("DELETE FROM likes WHERE board_id = ? AND user_id = ?").run(
      boardId,
      userDbId,
    );
    return { liked: false };
  }

  db.prepare(
    "INSERT INTO likes (board_id, user_id) VALUES (?, ?)",
  ).run(boardId, userDbId);
  return { liked: true };
}

function getBoardById(
  boardId: number,
  viewerUserDbId: number,
): { board?: BoardRow; error?: string } {
  const db = getDb();
  const row = db
    .prepare(
      `${SELECT_BODY} b.id = ? AND ${VIEWER_ACCESS_SQL} LIMIT 1`,
    )
    .get(
      viewerUserDbId,
      boardId,
      viewerUserDbId,
      viewerUserDbId,
    ) as BoardDbRow | undefined;

  if (!row) {
    return { error: "Board post not found." };
  }
  return { board: mapRow(row) };
}
