export function getDatabasePath(): string {
  return process.env.DATABASE_PATH ?? "./data/shareboard.dev.sqlite";
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
