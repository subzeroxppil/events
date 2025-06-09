// middleware.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export default async function middleware(req) {
  const pathname = req.nextUrl.pathname;
  const isLuckyDrawPage = req.nextUrl.pathname.startsWith("/luckydraw");
  const isAdminPage = req.nextUrl.pathname.startsWith("/admin");
  const isAdminApi = req.nextUrl.pathname.startsWith("/api/admin");
  const isAdminLoginPage = req.nextUrl.pathname.startsWith("/admin/login");
  const isAdminSignupPage = req.nextUrl.pathname.startsWith("/admin/signup");

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  const session = await decrypt(sessionCookie);

  if (isLuckyDrawPage) {
    const segments = pathname.split("/");
    const eventId = segments[2];
    const isLoginPage = segments[3] === "login";

    if (eventId && !isLoginPage) {
      const cookieKey = `luckyDrawSession${eventId}`;
      const luckyDrawSession = cookieStore.get(cookieKey)?.value;

      if (!luckyDrawSession) {
        return NextResponse.redirect(
          new URL(`/luckydraw/${eventId}/login`, req.url)
        );
      }
    }
  }

  if ((isAdminPage && !isAdminLoginPage && !isAdminSignupPage) || isAdminApi) {
    if (!session?.userId) {
      return NextResponse.redirect(
        new URL("/admin/login", process.env.NEXT_PUBLIC_BASE_URL)
      );
    }
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
