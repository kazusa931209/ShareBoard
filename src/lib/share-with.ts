import { sqlAll, sqlGet, sqlRun } from "@/lib/sql";

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

export async function listShareWithUsers(
  params: ListShareWithUsersParams,
): Promise<ListShareWithUsersResult> {
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

  const countRow = await sqlGet<{ total: number }>(
    `SELECT COUNT(*) AS total FROM users u WHERE ${where}`,
    bindings,
  );

  const total = countRow?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;

  const rows = await sqlAll<ShareUserRow>(
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
    [params.ownerUserDbId, ...bindings, pageSize, offset],
  );

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

export async function setShareWithUser(
  ownerUserDbId: number,
  targetUserId: string,
  shared: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const target = await sqlGet<{ id: number }>(
    "SELECT id FROM users WHERE user_id = ?",
    [targetUserId],
  );

  if (!target) {
    return { ok: false, error: "User not found." };
  }
  if (target.id === ownerUserDbId) {
    return { ok: false, error: "Cannot share with yourself." };
  }

  if (shared) {
    await sqlRun(
      `
      INSERT INTO share_with (owner_user_id, target_user_id)
      VALUES (?, ?)
      ON CONFLICT(owner_user_id, target_user_id) DO NOTHING
    `,
      [ownerUserDbId, target.id],
    );
  } else {
    await sqlRun(
      "DELETE FROM share_with WHERE owner_user_id = ? AND target_user_id = ?",
      [ownerUserDbId, target.id],
    );
  }

  return { ok: true };
}
