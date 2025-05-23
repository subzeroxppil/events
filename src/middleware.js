// middleware.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updateSession } from "@/lib/supabase/middleware";

export default async function middleware(req) {
  const isLuckyDrawPage = req.nextUrl.pathname.startsWith("/luckydraw");
  const isLuckyDrawLoginPage =
    req.nextUrl.pathname.startsWith("/luckydraw/login");
  const isAdminPage = req.nextUrl.pathname.startsWith("/admin");
  const isAdminApi = req.nextUrl.pathname.startsWith("/api/admin");
  const isAdminLoginPage = req.nextUrl.pathname.startsWith("/admin/login");

  const cookieStore = await cookies();
  const luckyDrawSession = cookieStore.get("luckyDrawSession")?.value;

  if (isLuckyDrawPage && !isLuckyDrawLoginPage && !luckyDrawSession) {
    return NextResponse.redirect(new URL("/luckydraw/login", req.url));
  }

  if ((isAdminPage && !isAdminLoginPage) || isAdminApi) {
    return await updateSession(req);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/luckydraw/:path*", "/admin/:path*", "/api/admin/:path*"],
};
