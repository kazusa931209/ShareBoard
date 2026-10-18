import type { Client, Row } from "@libsql/client";
import { createClient } from "@libsql/client";
import { getDb } from "@/lib/db";
import {
  getTursoAuthToken,
  getTursoDatabaseUrl,
  isTursoEnabled,
} from "@/lib/env";
import { SCHEMA_STATEMENTS } from "@/lib/schema";

export type SqlValue = string | number | null;

let tursoClient: Client | null = null;
let tursoSchemaReady = false;

function getTursoClient(): Client {
  if (!tursoClient) {
    tursoClient = createClient({
      url: getTursoDatabaseUrl(),
      authToken: getTursoAuthToken(),
    });
  }
  return tursoClient;
}

async function ensureTursoSchema(): Promise<void> {
  if (tursoSchemaReady) {
    return;
  }
  const client = getTursoClient();
  for (const statement of SCHEMA_STATEMENTS) {
    await client.execute(statement);
  }
  tursoSchemaReady = true;
}

function rowToRecord(row: Row, columns: string[]): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  for (let i = 0; i < columns.length; i++) {
    record[columns[i]] = row[i];
  }
  return record;
}

function coerceRow<T extends Record<string, unknown>>(
  record: Record<string, unknown>,
): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === "bigint") {
      out[key] = Number(value);
    } else {
      out[key] = value;
    }
  }
  return out as T;
}

export function isUniqueConstraintError(err: unknown): boolean {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "";
  return (
    message.includes("UNIQUE constraint failed") ||
    message.includes("SQLITE_CONSTRAINT_UNIQUE") ||
    message.includes("unique constraint")
  );
}

export async function sqlGet<T extends Record<string, unknown>>(
  sql: string,
  args: SqlValue[] = [],
): Promise<T | undefined> {
  if (isTursoEnabled()) {
    await ensureTursoSchema();
    const result = await getTursoClient().execute({ sql, args });
    if (result.rows.length === 0) {
      return undefined;
    }
    return coerceRow<T>(rowToRecord(result.rows[0], result.columns));
  }

  const row = getDb().prepare(sql).get(...args);
  return row as T | undefined;
}

export async function sqlAll<T extends Record<string, unknown>>(
  sql: string,
  args: SqlValue[] = [],
): Promise<T[]> {
  if (isTursoEnabled()) {
    await ensureTursoSchema();
    const result = await getTursoClient().execute({ sql, args });
    return result.rows.map((row) =>
      coerceRow<T>(rowToRecord(row, result.columns)),
    );
  }

  return getDb().prepare(sql).all(...args) as T[];
}

export async function sqlRun(
  sql: string,
  args: SqlValue[] = [],
): Promise<void> {
  if (isTursoEnabled()) {
    await ensureTursoSchema();
    await getTursoClient().execute({ sql, args });
    return;
  }

  getDb().prepare(sql).run(...args);
}
