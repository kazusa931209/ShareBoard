"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ErrorMessage, Field } from "@/components/ui";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const userId = String(form.get("userId") ?? "");
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    if (password !== confirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password }),
    });

    const data = (await res.json().catch(() => ({}))) as { error?: string };

    if (!res.ok) {
      const messages: Record<string, string> = {
        taken: "That User ID is already taken.",
        invalid_user_id:
          "User ID must be 3–32 characters (letters, numbers, underscore).",
        invalid_password: "Password must be at least 6 characters.",
      };
      setError(messages[data.error ?? ""] ?? "Registration failed.");
      setLoading(false);
      return;
    }

    router.push("/login?registered=1");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <ErrorMessage message={error} />
      <Field
        label="User ID"
        name="userId"
        autoComplete="username"
        required
        minLength={3}
        maxLength={32}
        pattern="[a-zA-Z0-9_]+"
        title="3–32 characters: letters, numbers, underscore"
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={6}
      />
      <Field
        label="Confirm password"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        minLength={6}
      />
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
