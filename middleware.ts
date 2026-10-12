import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/bookmarks",
  "/explore",
  "/notifications",
  "/posts",
  "/profile",
  "/settings",
  "/users",
];

export function middleware(request: NextRequest) {
  const isProtected = PROTECTED_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix));

  if (!isProtected) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get("myx_session")?.value);

  if (hasSession) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: ["/bookmarks/:path*", "/explore/:path*", "/notifications/:path*", "/posts/:path*", "/profile/:path*", "/settings/:path*", "/users/:path*"],
};
