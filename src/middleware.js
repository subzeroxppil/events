// middleware.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updateSession } from "@/lib/supabase/middleware";

export default async function middleware(req) {
  const pathname = req.nextUrl.pathname;
  const isLuckyDrawPage = req.nextUrl.pathname.startsWith("/luckydraw");
  const isAdminPage = req.nextUrl.pathname.startsWith("/admin");
  const isAdminApi = req.nextUrl.pathname.startsWith("/api/admin");
  const isAdminLoginPage = req.nextUrl.pathname.startsWith("/admin/login");

  const cookieStore = await cookies();

  if (isLuckyDrawPage) {
    const segments = pathname.split("/");
    const eventId = segments[2];
    const isLoginPage = segments[3] === "login";

    if (eventId && !isLoginPage) {
      const cookieStore = await cookies();
      const cookieKey = `luckyDrawSession${eventId}`;
      const luckyDrawSession = cookieStore.get(cookieKey)?.value;

      if (!luckyDrawSession) {
        return NextResponse.redirect(
          new URL(`/luckydraw/${eventId}/login`, req.url)
        );
      }
    }
  }

  if ((isAdminPage && !isAdminLoginPage) || isAdminApi) {
    return await updateSession(req);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/luckydraw/:path*",
    "/luckydraw",
    "/admin/:path*",
    "/admin",
    "/api/admin/:path*",
    "/api/admin",
  ],
};
