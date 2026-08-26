import { timingSafeEqual } from "crypto";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);

  if (ba.length !== bb.length) return false;

  return timingSafeEqual(new Uint8Array(ba), new Uint8Array(bb));
}

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

  if (
    !returnedState ||
    !storedState ||
    !safeEqual(returnedState, storedState)
  ) {
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
  };

  if (!tokenJson.id_token) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  const verifyRes = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      id_token: tokenJson.id_token,
      client_id: channelId,
    }),
  });

  if (!verifyRes.ok) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  const payload = (await verifyRes.json()) as {
    sub: string;
    name?: string;
    picture?: string;
  };

  if (!payload.sub) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

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
