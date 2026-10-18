import { getSessionUser } from "@/lib/auth";
import { errorResponse, jsonResponse, withDbHandlerContext } from "@/lib/api";
import { softDeleteBoard, updateBoard } from "@/lib/boards";

export const PATCH = withDbHandlerContext(async (request, context) => {
  const session = await getSessionUser();
  if (!session) {
    return errorResponse("Sign in required.", 401);
  }

  const { id } = await context.params;
  const boardId = Number.parseInt(id, 10);
  if (!Number.isFinite(boardId)) {
    return errorResponse("Invalid board id.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body.");
  }

  const { title, url, content, other } = body as {
    title?: string;
    url?: string;
    content?: string;
    other?: string;
  };

  const result = await updateBoard(boardId, session.id, {
    title: title ?? "",
    url,
    content: content ?? "",
    other,
  });

  if (result.error || !result.board) {
    return errorResponse(result.error ?? "Could not update post.", 400);
  }

  return jsonResponse({ board: result.board });
});

export const DELETE = withDbHandlerContext(async (_request, context) => {
  const session = await getSessionUser();
  if (!session) {
    return errorResponse("Sign in required.", 401);
  }

  const { id } = await context.params;
  const boardId = Number.parseInt(id, 10);
  if (!Number.isFinite(boardId)) {
    return errorResponse("Invalid board id.");
  }

  const result = await softDeleteBoard(boardId, session.id);
  if (!result.ok) {
    return errorResponse(result.error ?? "Delete failed.", 403);
  }

  return jsonResponse({ ok: true });
});
