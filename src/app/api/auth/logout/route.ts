import { NextResponse } from "next/server";
import { clearSessionCookie, getSessionUser } from "@/lib/auth";
import { errorResponse, withDbHandler } from "@/lib/api";

export const POST = withDbHandler(async () => {
  const user = await getSessionUser();
  if (!user) {
    return errorResponse("Not signed in.", 401);
  }

  const response = NextResponse.json({ ok: true });
  const cookie = clearSessionCookie();
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
});
