"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Mode = "login" | "register";

type AuthFormProps = {
  mode: Mode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const endpoint =
    mode === "login" ? "/api/auth/login" : "/api/auth/register";
  const title = mode === "login" ? "Sign in" : "Create account";
  const submitLabel = mode === "login" ? "Sign in" : "Register";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push("/board");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card stack">
      <div>
        <h2>{title}</h2>
        <p className="muted" style={{ margin: 0 }}>
          Use a User ID and password — no email required.
        </p>
      </div>

      <form className="stack" onSubmit={onSubmit}>
        <label>
          User ID
          <input
            autoComplete="username"
            maxLength={32}
            name="userId"
            required
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </label>
        <label>
          Password
          <input
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            minLength={6}
            name="password"
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn" disabled={loading} type="submit">
          {loading ? "Please wait…" : submitLabel}
        </button>
      </form>

      <p className="auth-links" style={{ margin: 0 }}>
        {mode === "login" ? (
          <>
            New here? <Link href="/register">Register</Link>
          </>
        ) : (
          <>
            Already have an account? <Link href="/login">Sign in</Link>
          </>
        )}
      </p>
    </div>
  );
}
