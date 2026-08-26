import type { NextRequest } from "next/server";

import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

import { sanitizeCallbackUrl } from "@/lib/auth-redirect";

const protectedPaths = [
  "/dashboard",
  "/line-accounts",
  "/rich-menus",
  "/users",
  "/import",
  "/deploy-logs",
  "/profile",
];

const systemAdminOnlyPaths = ["/users"];

const publicApiPrefixes = [
  "/api/auth",
  "/api/webhook/line",
  "/api/rich-menus/redirect",
];

function isProtectedPath(pathname: string): boolean {
  return protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

function isSystemAdminOnlyPath(pathname: string): boolean {
  return systemAdminOnlyPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

function isPublicApi(pathname: string): boolean {
  return publicApiPrefixes.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (pathname.startsWith("/api/")) {
    if (isPublicApi(pathname)) return NextResponse.next();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if ((token.isApproved as boolean | undefined) !== true) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.next();
  }

  if (pathname === "/pending-approval") {
    if (!token) {
      const loginUrl = new URL("/login", request.url);

      return NextResponse.redirect(loginUrl);
    }

    if ((token.isApproved as boolean | undefined) === true) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) return NextResponse.next();

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    const safe = sanitizeCallbackUrl(pathname);

    loginUrl.searchParams.set("callbackUrl", safe);

    return NextResponse.redirect(loginUrl);
  }

  const isApproved = (token.isApproved as boolean | undefined) === true;

  if (!isApproved) {
    return NextResponse.redirect(new URL("/pending-approval", request.url));
  }

  const isSystemAdmin = (token.isSystemAdmin as boolean | undefined) === true;

  if (isSystemAdminOnlyPath(pathname) && !isSystemAdmin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
