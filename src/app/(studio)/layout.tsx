import { redirect } from "next/navigation";
import { StudioShell } from "@/components/studio/StudioShell";
import { getSessionUser } from "@/lib/auth";

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return <StudioShell userId={user.userId}>{children}</StudioShell>;
}
