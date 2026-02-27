import type { NextRequest } from "next/server";

import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

const protectedPaths = [
  "/dashboard",
  "/organizations",
  "/line-accounts",
  "/rich-menus",
  "/users",
  "/import",
  "/deploy-logs",
  "/analytics",
  "/settings",
];

function isProtectedPath(pathname: string): boolean {
  return protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) return NextResponse.next();

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);

    loginUrl.searchParams.set("callbackUrl", pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
