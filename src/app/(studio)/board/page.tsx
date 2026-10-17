import { BoardPanel } from "@/components/studio/BoardPanel";
import { getSessionUser } from "@/lib/auth";

export default async function BoardPage() {
  const user = await getSessionUser();

  return <BoardPanel currentUserId={user?.userId ?? ""} />;
}
