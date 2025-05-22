// middleware.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export default async function middleware(req) {
  const isLuckyDrawPage = req.nextUrl.pathname.startsWith("/luckydraw");
  const isLoginPage = req.nextUrl.pathname.startsWith("/luckydraw/login");

  const cookieStore = await cookies();
  const session = cookieStore.get("luckyDrawSession")?.value;

  if (isLuckyDrawPage && !isLoginPage && !session) {
    return NextResponse.redirect(new URL("/luckydraw/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/luckydraw/:path*"],
};
