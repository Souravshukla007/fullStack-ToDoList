import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "todo_session";

function getJwtSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-only-change-me";
  return new TextEncoder().encode(secret);
}

async function hasValidSession(req) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;

  try {
    await jwtVerify(token, getJwtSecret());
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const loggedIn = await hasValidSession(req);

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isProtected = pathname === "/" || pathname.startsWith("/analytics");

  if (isProtected && !loggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuthPage && loggedIn) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/analytics/:path*", "/login", "/signup"],
};
