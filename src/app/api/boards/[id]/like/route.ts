import { getSessionUser } from "@/lib/auth";
import { errorResponse, jsonResponse, withDbHandlerContext } from "@/lib/api";
import { toggleBoardLike } from "@/lib/boards";

export const POST = withDbHandlerContext(async (_request, context) => {
  const session = await getSessionUser();
  if (!session) {
    return errorResponse("Sign in required.", 401);
  }

  const { id } = await context.params;
  const boardId = Number.parseInt(id, 10);
  if (!Number.isFinite(boardId)) {
    return errorResponse("Invalid board id.");
  }

  const result = await toggleBoardLike(boardId, session.id);
  if (result.error) {
    return errorResponse(result.error, 400);
  }

  return jsonResponse({ liked: result.liked });
});
