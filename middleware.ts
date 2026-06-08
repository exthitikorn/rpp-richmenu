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
  "/profile",
];

function isProtectedPath(pathname: string): boolean {
  return protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (pathname === "/pending-approval") {
    if (!token) {
      const loginUrl = new URL("/login", request.url);

      return NextResponse.redirect(loginUrl);
    }

    if ((token.isApproved as boolean | undefined) === true) {
      return NextResponse.redirect(new URL("/organizations", request.url));
    }

    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) return NextResponse.next();

  if (!token) {
    const loginUrl = new URL("/login", request.url);

    loginUrl.searchParams.set("callbackUrl", pathname);

    return NextResponse.redirect(loginUrl);
  }

  const isApproved = (token.isApproved as boolean | undefined) === true;

  if (!isApproved) {
    return NextResponse.redirect(new URL("/pending-approval", request.url));
  }

  const isAdmin = (token.isAdmin as boolean | undefined) === true;
  const isDashboardPath =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  if (isDashboardPath && !isAdmin) {
    return NextResponse.redirect(new URL("/organizations", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
