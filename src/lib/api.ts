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
