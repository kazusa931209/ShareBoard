import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { loginUser, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body.");
  }

  const { userId, password } = body as { userId?: string; password?: string };
  if (typeof userId !== "string" || typeof password !== "string") {
    return errorResponse("userId and password are required.");
  }

  const result = await loginUser(userId, password);
  if (result.error || !result.user) {
    return errorResponse(result.error ?? "Login failed.", 401);
  }

  const response = NextResponse.json({ user: { userId: result.user.userId } });
  const cookie = setSessionCookie(result.user);
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
