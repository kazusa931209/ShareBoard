import { getSessionUser } from "@/lib/auth";
import { errorResponse, jsonResponse, withDbHandler } from "@/lib/api";
import {
  createBoard,
  listBoards,
  type BoardSearchField,
  type LikeFilter,
} from "@/lib/boards";

function parseSearchField(value: string | null): BoardSearchField {
  if (
    value === "content" ||
    value === "other" ||
    value === "poster"
  ) {
    return value;
  }
  return "title";
}

function parseLikeFilter(value: string | null): LikeFilter {
  if (value === "like" || value === "not_yet") {
    return value;
  }
  return "all";
}

export const GET = withDbHandler(async (request) => {
  const session = await getSessionUser();
  if (!session) {
    return errorResponse("Sign in required.", 401);
  }

  const { searchParams } = new URL(request.url);
  const page = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = Number.parseInt(searchParams.get("pageSize") ?? "20", 10);
  const keyword = searchParams.get("keyword") ?? undefined;
  const keywordField = parseSearchField(searchParams.get("keywordField"));
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;
  const likeFilter = parseLikeFilter(searchParams.get("likeFilter"));

  const result = await listBoards({
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 20,
    keyword,
    keywordField,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    likeFilter,
    viewerUserDbId: session.id,
  });

  return jsonResponse(result);
});

export const POST = withDbHandler(async (request) => {
  const session = await getSessionUser();
  if (!session) {
    return errorResponse("Sign in required.", 401);
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

  const result = await createBoard(session.id, {
    title: title ?? "",
    url,
    content: content ?? "",
    other,
  });

  if (result.error || !result.board) {
    return errorResponse(result.error ?? "Could not create post.", 400);
  }

  return jsonResponse({ board: result.board }, { status: 201 });
});
