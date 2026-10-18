import { sqlAll, sqlGet, sqlRun } from "@/lib/sql";
import { validatePostContent } from "@/lib/validation";

export type Post = {
  id: number;
  content: string;
  createdAt: string;
  authorUserId: string;
};

export async function listPosts(limit = 100): Promise<Post[]> {
  return sqlAll<Post>(
    `
      SELECT p.id, p.content, p.created_at AS createdAt, u.user_id AS authorUserId
      FROM posts p
      INNER JOIN users u ON u.id = p.user_id
      ORDER BY p.created_at DESC
      LIMIT ?
    `,
    [limit],
  );
}

export async function createPost(
  userDbId: number,
  content: string,
): Promise<{ post?: Post; error?: string }> {
  const contentError = validatePostContent(content);
  if (contentError) {
    return { error: contentError };
  }

  const trimmed = content.trim();
  const row = await sqlGet<{
    id: number;
    content: string;
    createdAt: string;
  }>(
    `
      INSERT INTO posts (user_id, content)
      VALUES (?, ?)
      RETURNING id, content, created_at AS createdAt
    `,
    [userDbId, trimmed],
  );

  if (!row) {
    return { error: "Could not create post." };
  }

  const author = await sqlGet<{ user_id: string }>(
    "SELECT user_id FROM users WHERE id = ?",
    [userDbId],
  );

  return {
    post: {
      id: row.id,
      content: row.content,
      createdAt: row.createdAt,
      authorUserId: author?.user_id ?? "",
    },
  };
}

export async function deletePost(
  postId: number,
  userDbId: number,
): Promise<{ ok: boolean; error?: string }> {
  const existing = await sqlGet<{ user_id: number }>(
    "SELECT user_id FROM posts WHERE id = ?",
    [postId],
  );

  if (!existing) {
    return { ok: false, error: "Post not found." };
  }
  if (existing.user_id !== userDbId) {
    return { ok: false, error: "You can only delete your own posts." };
  }

  await sqlRun("DELETE FROM posts WHERE id = ?", [postId]);
  return { ok: true };
}
