import { getSessionUser } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/api";
import { createPost, listPosts } from "@/lib/posts";

export async function GET() {
  const posts = listPosts();
  return jsonResponse({ posts });
}

export async function POST(request: Request) {
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
  const result = createPost(session.id, content ?? "");
  if (result.error || !result.post) {
    return errorResponse(result.error ?? "Could not create post.", 400);
  }

  return jsonResponse({ post: result.post }, { status: 201 });
}
