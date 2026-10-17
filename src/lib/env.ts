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
