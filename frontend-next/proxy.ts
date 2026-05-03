import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessCookie = request.cookies.get("access");
  const isAuthenticated = Boolean(accessCookie);
  const isPublicPath =
    pathname === "/" || PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (isAuthenticated && PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/overview", request.url));
  }

  if (!isAuthenticated && !isPublicPath) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("auth", "login");
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
