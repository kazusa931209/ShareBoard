import { getSessionUser } from "@/lib/auth";
import { jsonResponse, withDbHandler } from "@/lib/api";

export const GET = withDbHandler(async () => {
  const user = await getSessionUser();
  if (!user) {
    return jsonResponse({ user: null });
  }
  return jsonResponse({ user: { userId: user.userId } });
});
