import { getSessionUser } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/api";
import { setShareWithUser } from "@/lib/share-with";

type RouteContext = { params: Promise<{ userId: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const session = await getSessionUser();
  if (!session) {
    return errorResponse("Sign in required.", 401);
  }

  const { userId: targetUserId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body.");
  }

  const { shared } = body as { shared?: boolean };
  if (typeof shared !== "boolean") {
    return errorResponse("shared (boolean) is required.");
  }

  const result = setShareWithUser(session.id, targetUserId, shared);
  if (!result.ok) {
    return errorResponse(result.error ?? "Update failed.", 400);
  }

  return jsonResponse({ ok: true, shared });
}
