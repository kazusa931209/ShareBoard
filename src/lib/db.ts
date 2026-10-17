import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { getDatabasePath } from "@/lib/env";

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) <= 2000),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

  CREATE TABLE IF NOT EXISTS boards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT,
    content TEXT NOT NULL CHECK (length(content) <= 10000),
    other TEXT CHECK (other IS NULL OR length(other) <= 10000),
    post_datetime TEXT NOT NULL DEFAULT (datetime('now')),
    is_deleted INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (board_id, user_id)
  );

  CREATE INDEX IF NOT EXISTS idx_boards_sort ON boards (is_deleted, post_datetime DESC);
  CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards (user_id);
  CREATE INDEX IF NOT EXISTS idx_likes_board_id ON likes (board_id);
  CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes (user_id);

  CREATE TABLE IF NOT EXISTS share_with (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (owner_user_id, target_user_id)
  );

  CREATE INDEX IF NOT EXISTS idx_share_with_owner ON share_with (owner_user_id);
  CREATE INDEX IF NOT EXISTS idx_share_with_target ON share_with (target_user_id);
`;

let db: Database.Database | null = null;

function resolveDbPath(): string {
  return path.resolve(process.cwd(), getDatabasePath());
}

export function getDb(): Database.Database {
  if (db) {
    return db;
  }

  const filePath = resolveDbPath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  db = new Database(filePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);

  return db;
}
