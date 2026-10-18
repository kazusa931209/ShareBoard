import { getSessionUser } from "@/lib/auth";
import { errorResponse, jsonResponse, withDbHandlerContext } from "@/lib/api";
import { deletePost } from "@/lib/posts";

export const DELETE = withDbHandlerContext(async (_request, context) => {
  const session = await getSessionUser();
  if (!session) {
    return errorResponse("Sign in to delete posts.", 401);
  }

  const { id } = await context.params;
  const postId = Number.parseInt(id, 10);
  if (!Number.isFinite(postId)) {
    return errorResponse("Invalid post id.");
  }

  const result = await deletePost(postId, session.id);
  if (!result.ok) {
    return errorResponse(result.error ?? "Delete failed.", 403);
  }

  return jsonResponse({ ok: true });
});
