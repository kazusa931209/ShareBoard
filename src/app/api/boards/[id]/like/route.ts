import { getSessionUser } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/api";
import { toggleBoardLike } from "@/lib/boards";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const session = await getSessionUser();
  if (!session) {
    return errorResponse("Sign in required.", 401);
  }

  const { id } = await context.params;
  const boardId = Number.parseInt(id, 10);
  if (!Number.isFinite(boardId)) {
    return errorResponse("Invalid board id.");
  }

  const result = toggleBoardLike(boardId, session.id);
  if (result.error) {
    return errorResponse(result.error, 400);
  }

  return jsonResponse({ liked: result.liked });
}
