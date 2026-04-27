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

  // ผู้ใช้ที่ล็อกอินด้วย LINE (หรืออื่น) ที่ยังไม่อนุมัติ → ไปกรอกข้อมูลที่ /register-line
  const isApproved = (token.isApproved as boolean | undefined) === true;

  if (!isApproved) {
    return NextResponse.redirect(new URL("/register-line", request.url));
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
