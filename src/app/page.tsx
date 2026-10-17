import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/board");
  }

  return (
    <div className="auth-page">
      <div className="auth-page-inner">
        <h1 className="auth-brand">ShareBoard</h1>
        <div className="card stack">
          <p style={{ margin: 0 }}>
            Sign in with your <strong>User ID</strong> and password, or register
            a new account. Everyone on the same server shares one board.
          </p>
          <div className="auth-links">
            <Link className="btn" href="/login">Sign in</Link>
            <Link className="btn btn-ghost" href="/register">Register</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
