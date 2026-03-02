import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const returnedState = url.searchParams.get("state");

  if (error) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("line_oauth_state")?.value;

  if (!returnedState || !storedState || returnedState !== storedState) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/api/auth/signin", request.url));
  }

  const channelId = process.env.LINE_LOGIN_CHANNEL_ID;
  const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET;
  const callbackUrl = process.env.LINE_LOGIN_CALLBACK_URL;

  if (!channelId || !channelSecret || !callbackUrl) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUrl,
      client_id: channelId,
      client_secret: channelSecret,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  const tokenJson = (await tokenRes.json()) as {
    id_token?: string;
    access_token?: string;
  };

  if (!tokenJson.id_token) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  const [, payloadBase64] = tokenJson.id_token.split(".");
  const payloadJson = Buffer.from(payloadBase64, "base64").toString("utf8");
  const payload = JSON.parse(payloadJson) as {
    sub: string;
    name?: string;
    picture?: string;
  };

  const existing = await prisma.user.findFirst({
    where: { lineUserId: payload.sub },
  });

  if (existing && existing.id !== user.id) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lineUserId: payload.sub,
      lineDisplayName: payload.name,
      linePictureUrl: payload.picture,
    },
  });

  const response = NextResponse.redirect(new URL("/profile", request.url));

  response.cookies.set("line_oauth_state", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
