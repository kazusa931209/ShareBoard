import { runWithDb } from "@/lib/db";

export type ApiRouteContext = { params: Promise<Record<string, string>> };

/** Wrap API handlers that use SQLite (required on Vercel). */
export function withDbHandler(
  handler: (request: Request) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return (request) => runWithDb(() => handler(request));
}

export function withDbHandlerContext(
  handler: (request: Request, context: ApiRouteContext) => Promise<Response>,
): (request: Request, context: ApiRouteContext) => Promise<Response> {
  return (request, context) => runWithDb(() => handler(request, context));
}

export function jsonResponse(
  body: unknown,
  init?: { status?: number; headers?: HeadersInit },
): Response {
  return Response.json(body, {
    status: init?.status ?? 200,
    headers: init?.headers,
  });
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, { status });
}
