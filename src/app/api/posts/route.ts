import { getSessionUser } from "@/lib/auth";
import { errorResponse, jsonResponse, withDbHandler } from "@/lib/api";
import { createPost, listPosts } from "@/lib/posts";

export const GET = withDbHandler(async () => {
  const posts = await listPosts();
  return jsonResponse({ posts });
});

export const POST = withDbHandler(async (request) => {
  const session = await getSessionUser();
  if (!session) {
    return errorResponse("Sign in to post.", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body.");
  }

  const { content } = body as { content?: string };
  const result = await createPost(session.id, content ?? "");
  if (result.error || !result.post) {
    return errorResponse(result.error ?? "Could not create post.", 400);
  }

  return jsonResponse({ post: result.post }, { status: 201 });
});
