import { getDb } from "@/lib/db";
import { validatePostContent } from "@/lib/validation";

export type Post = {
  id: number;
  content: string;
  createdAt: string;
  authorUserId: string;
};

export function listPosts(limit = 100): Post[] {
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT p.id, p.content, p.created_at AS createdAt, u.user_id AS authorUserId
      FROM posts p
      INNER JOIN users u ON u.id = p.user_id
      ORDER BY p.created_at DESC
      LIMIT ?
    `,
    )
    .all(limit) as Post[];

  return rows;
}

export function createPost(
  userDbId: number,
  content: string,
): { post?: Post; error?: string } {
  const contentError = validatePostContent(content);
  if (contentError) {
    return { error: contentError };
  }

  const trimmed = content.trim();
  const db = getDb();
  const row = db
    .prepare(
      `
      INSERT INTO posts (user_id, content)
      VALUES (?, ?)
      RETURNING id, content, created_at AS createdAt
    `,
    )
    .get(userDbId, trimmed) as {
    id: number;
    content: string;
    createdAt: string;
  };

  const author = db
    .prepare("SELECT user_id FROM users WHERE id = ?")
    .get(userDbId) as { user_id: string };

  return {
    post: {
      id: row.id,
      content: row.content,
      createdAt: row.createdAt,
      authorUserId: author.user_id,
    },
  };
}

export function deletePost(
  postId: number,
  userDbId: number,
): { ok: boolean; error?: string } {
  const db = getDb();
  const existing = db
    .prepare("SELECT user_id FROM posts WHERE id = ?")
    .get(postId) as { user_id: number } | undefined;

  if (!existing) {
    return { ok: false, error: "Post not found." };
  }
  if (existing.user_id !== userDbId) {
    return { ok: false, error: "You can only delete your own posts." };
  }

  db.prepare("DELETE FROM posts WHERE id = ?").run(postId);
  return { ok: true };
}
