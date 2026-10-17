import { getSessionUser } from "@/lib/auth";
import { jsonResponse } from "@/lib/api";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return jsonResponse({ user: null });
  }
  return jsonResponse({ user: { userId: user.userId } });
}
