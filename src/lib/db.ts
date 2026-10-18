import Database from "better-sqlite3";
import { AsyncLocalStorage } from "async_hooks";
import fs from "fs";
import path from "path";
import { getDatabasePath, isTursoEnabled } from "@/lib/env";
import { SCHEMA_STATEMENTS } from "@/lib/schema";

let localDb: Database.Database | null = null;
const requestDb = new AsyncLocalStorage<Database.Database>();

function resolveDbPath(): string {
  return path.resolve(process.cwd(), getDatabasePath());
}

function openDatabase(filePath: string): Database.Database {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const connection = new Database(filePath);
  connection.pragma("foreign_keys = ON");
  connection.pragma("busy_timeout = 5000");

  if (process.env.VERCEL) {
    connection.pragma("journal_mode = DELETE");
  } else {
    connection.pragma("journal_mode = WAL");
  }

  for (const statement of SCHEMA_STATEMENTS) {
    connection.exec(statement);
  }
  return connection;
}

/**
 * Wrap API handlers that touch the local SQLite file (skipped when using Turso).
 */
export async function runWithDb<T>(fn: () => T | Promise<T>): Promise<T> {
  if (isTursoEnabled()) {
    return await fn();
  }

  if (!process.env.VERCEL) {
    return await fn();
  }

  const filePath = resolveDbPath();
  const connection = openDatabase(filePath);

  return requestDb.run(connection, async () => {
    try {
      return await fn();
    } finally {
      connection.close();
    }
  });
}

export function getDb(): Database.Database {
  if (isTursoEnabled()) {
    throw new Error("getDb() is not used with Turso; use sqlGet/sqlAll/sqlRun.");
  }

  if (process.env.VERCEL) {
    const scoped = requestDb.getStore();
    if (!scoped) {
      throw new Error("getDb() on Vercel must run inside runWithDb().");
    }
    return scoped;
  }

  if (localDb) {
    return localDb;
  }

  localDb = openDatabase(resolveDbPath());
  return localDb;
}
