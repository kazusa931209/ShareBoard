import { getSessionUser } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/api";
import { listShareWithUsers } from "@/lib/share-with";

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return errorResponse("Sign in required.", 401);
  }

  const { searchParams } = new URL(request.url);
  const page = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = Number.parseInt(searchParams.get("pageSize") ?? "20", 10);
  const keyword = searchParams.get("keyword") ?? undefined;

  const result = listShareWithUsers({
    ownerUserDbId: session.id,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 20,
    keyword: keyword || undefined,
  });

  return jsonResponse({
    users: result.items,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
  });
}
