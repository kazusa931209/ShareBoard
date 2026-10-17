import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getSessionUser } from "@/lib/auth";

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/board");
  }

  return (
    <div className="auth-page">
      <div className="auth-page-inner">
        <h1 className="auth-brand">
          <Link href="/">ShareBoard</Link>
        </h1>
        <AuthForm mode="register" />
      </div>
    </div>
  );
}
