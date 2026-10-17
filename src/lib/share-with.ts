import { getDb } from "@/lib/db";

export type ShareWithUser = {
  userId: string;
  shared: boolean;
};

export type ListShareWithUsersParams = {
  ownerUserDbId: number;
  page: number;
  pageSize: number;
  keyword?: string;
};

export type ListShareWithUsersResult = {
  items: ShareWithUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type ShareUserRow = {
  userId: string;
  shared: number;
};

export function listShareWithUsers(
  params: ListShareWithUsersParams,
): ListShareWithUsersResult {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const keyword = params.keyword?.trim();

  const conditions = ["u.id != ?"];
  const bindings: (string | number)[] = [params.ownerUserDbId];

  if (keyword) {
    conditions.push("u.user_id LIKE ? COLLATE NOCASE");
    bindings.push(`%${keyword}%`);
  }

  const where = conditions.join(" AND ");
  const db = getDb();

  const countRow = db
    .prepare(`SELECT COUNT(*) AS total FROM users u WHERE ${where}`)
    .get(...bindings) as { total: number };

  const total = countRow.total;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;

  const rows = db
    .prepare(
      `
      SELECT u.user_id AS userId,
        EXISTS (
          SELECT 1 FROM share_with s
          WHERE s.owner_user_id = ? AND s.target_user_id = u.id
        ) AS shared
      FROM users u
      WHERE ${where}
      ORDER BY u.user_id COLLATE NOCASE ASC
      LIMIT ? OFFSET ?
    `,
    )
    .all(params.ownerUserDbId, ...bindings, pageSize, offset) as ShareUserRow[];

  return {
    items: rows.map((row) => ({
      userId: row.userId,
      shared: row.shared === 1,
    })),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export function setShareWithUser(
  ownerUserDbId: number,
  targetUserId: string,
  shared: boolean,
): { ok: boolean; error?: string } {
  const db = getDb();
  const target = db
    .prepare("SELECT id FROM users WHERE user_id = ?")
    .get(targetUserId) as { id: number } | undefined;

  if (!target) {
    return { ok: false, error: "User not found." };
  }
  if (target.id === ownerUserDbId) {
    return { ok: false, error: "Cannot share with yourself." };
  }

  if (shared) {
    db.prepare(
      `
      INSERT INTO share_with (owner_user_id, target_user_id)
      VALUES (?, ?)
      ON CONFLICT(owner_user_id, target_user_id) DO NOTHING
    `,
    ).run(ownerUserDbId, target.id);
  } else {
    db.prepare(
      "DELETE FROM share_with WHERE owner_user_id = ? AND target_user_id = ?",
    ).run(ownerUserDbId, target.id);
  }

  return { ok: true };
}
