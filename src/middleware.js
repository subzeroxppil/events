// middleware.js
import { NextResponse } from "next/server";

export function middleware(req) {
  const isLuckyDrawPage = req.nextUrl.pathname.startsWith("/luckydraw");
  const isLoginPage = req.nextUrl.pathname.startsWith("/luckydraw/login");

  const session = req.cookies.get("luckyDrawSession");

  if (isLuckyDrawPage && !isLoginPage && !session) {
    return NextResponse.redirect(new URL("/luckydraw/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/luckydraw/:path*"],
};
