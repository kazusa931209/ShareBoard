export function getDatabasePath(): string {
  const configured =
    process.env.DATABASE_PATH ?? "./data/shareboard.dev.sqlite";

  // Vercel serverless: only /tmp is writable; ./data/... in env cannot work.
  if (process.env.VERCEL && !configured.startsWith("/tmp/")) {
    const base = configured.replace(/^(\.\/)?/, "").split("/").pop();
    const fileName =
      base && base.endsWith(".sqlite") ? base : "shareboard.sqlite";
    return `/tmp/${fileName}`;
  }

  return configured;
}

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET must be set (at least 16 characters). See .env.development or .env.production.",
    );
  }
  return secret;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Production with Turso credentials uses remote libSQL instead of local SQLite. */
export function isTursoEnabled(): boolean {
  if (!isProduction()) {
    return false;
  }
  const url = process.env.TURSO_DATABASE_URL?.trim();
  const token = process.env.TURSO_AUTH_TOKEN?.trim();
  return Boolean(url && token);
}

export function getTursoDatabaseUrl(): string {
  const url = process.env.TURSO_DATABASE_URL?.trim();
  if (!url) {
    throw new Error("TURSO_DATABASE_URL is required when using Turso.");
  }
  return url;
}

export function getTursoAuthToken(): string {
  const token = process.env.TURSO_AUTH_TOKEN?.trim();
  if (!token) {
    throw new Error("TURSO_AUTH_TOKEN is required when using Turso.");
  }
  return token;
}
