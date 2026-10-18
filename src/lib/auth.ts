import bcrypt from "bcryptjs";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getAuthSecret, isProduction } from "@/lib/env";
import { isUniqueConstraintError, sqlGet } from "@/lib/sql";
import {
  normalizeUserId,
  validatePassword,
  validateUserId,
} from "@/lib/validation";

export const SESSION_COOKIE = "shareboard_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 14; // 14 days

export type SessionUser = {
  id: number;
  userId: string;
};

type SessionPayload = {
  id: number;
  userId: string;
  exp: number;
};

function signPayload(payloadB64: string): string {
  return createHmac("sha256", getAuthSecret())
    .update(payloadB64)
    .digest("base64url");
}

function encodeSession(user: SessionUser): string {
  const payload: SessionPayload = {
    id: user.id,
    userId: user.userId,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = signPayload(payloadB64);
  return `${payloadB64}.${sig}`;
}

function decodeSession(token: string): SessionUser | null {
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) {
    return null;
  }

  const expected = signPayload(payloadB64);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) {
      return null;
    }
    if (typeof payload.id !== "number" || typeof payload.userId !== "string") {
      return null;
    }
    return { id: payload.id, userId: payload.userId };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return decodeSession(token);
}

export function setSessionCookie(user: SessionUser): {
  name: string;
  value: string;
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax";
    path: string;
    maxAge: number;
  };
} {
  return {
    name: SESSION_COOKIE,
    value: encodeSession(user),
    options: {
      httpOnly: true,
      secure: isProduction(),
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SEC,
    },
  };
}

export function clearSessionCookie(): {
  name: string;
  value: string;
  options: { httpOnly: boolean; path: string; maxAge: number };
} {
  return {
    name: SESSION_COOKIE,
    value: "",
    options: { httpOnly: true, path: "/", maxAge: 0 },
  };
}

export async function registerUser(
  rawUserId: string,
  password: string,
): Promise<{ user?: SessionUser; error?: string }> {
  const userIdError = validateUserId(rawUserId);
  if (userIdError) {
    return { error: userIdError };
  }
  const passwordError = validatePassword(password);
  if (passwordError) {
    return { error: passwordError };
  }

  const userId = normalizeUserId(rawUserId);
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const result = await sqlGet<{ id: number; user_id: string }>(
      "INSERT INTO users (user_id, password_hash) VALUES (?, ?) RETURNING id, user_id",
      [userId, passwordHash],
    );

    if (!result) {
      return { error: "Registration failed." };
    }

    return { user: { id: result.id, userId: result.user_id } };
  } catch (err: unknown) {
    if (isUniqueConstraintError(err)) {
      return { error: "That User ID is already taken." };
    }
    throw err;
  }
}

export async function loginUser(
  rawUserId: string,
  password: string,
): Promise<{ user?: SessionUser; error?: string }> {
  const userIdError = validateUserId(rawUserId);
  if (userIdError) {
    return { error: userIdError };
  }
  const passwordError = validatePassword(password);
  if (passwordError) {
    return { error: passwordError };
  }

  const userId = normalizeUserId(rawUserId);
  const row = await sqlGet<{
    id: number;
    user_id: string;
    password_hash: string;
  }>("SELECT id, user_id, password_hash FROM users WHERE user_id = ?", [
    userId,
  ]);

  if (!row) {
    return { error: "Invalid User ID or password." };
  }

  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) {
    return { error: "Invalid User ID or password." };
  }

  return { user: { id: row.id, userId: row.user_id } };
}
