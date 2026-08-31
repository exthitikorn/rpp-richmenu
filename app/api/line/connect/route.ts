import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { randomId } from "@/lib/random-id";

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/api/auth/signin", request.url));
  }

  const channelId = process.env.LINE_LOGIN_CHANNEL_ID;
  const callbackUrl = process.env.LINE_LOGIN_CALLBACK_URL;

  if (!channelId || !callbackUrl) {
    return NextResponse.json(
      { success: false, error: "LINE Login is not configured" },
      { status: 500 },
    );
  }

  const state = randomId();
  const scope = "openid profile";

  const authorizeUrl = new URL("https://access.line.me/oauth2/v2.1/authorize");

  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", channelId);
  authorizeUrl.searchParams.set("redirect_uri", callbackUrl);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("scope", scope);

  const response = NextResponse.redirect(authorizeUrl);

  response.cookies.set("line_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}
