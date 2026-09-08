"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MainNav } from "@/components/MainNav";
import { UserNav } from "@/components/UserNav";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();

  // The border is what separates a sticky bar from content passing underneath
  // it. At the top of the page there is nothing to separate from, so drawing a
  // line there is just a line; it earns its place only once the page has
  // scrolled.
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll(); // A restored tab can mount already scrolled.
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The public view-only draw page is watched full-screen on phones — the logo
  // bar would eat scarce vertical space there.
  if (pathname.startsWith("/live")) return null;

  // The landing page opens on a blue hero that runs up behind the bar, so the
  // bar stays transparent there and lets it through. Everywhere else — the
  // admin portal above all — it is white.
  const onLandingPage = pathname === "/";

  return (
    // The draw screens fill the window and hide this by the attribute — see
    // `.live-page-host` in globals.css.
    <div
      data-site-header
      className={cn(
        "sticky top-0 z-50 w-full backdrop-blur-md transition-[background-color,border-color] duration-200",
        // On the landing page the bar has no colour of its own: the hero
        // gradient runs up behind it, so leaving it transparent is what makes
        // the two read as one surface. A tint only appears once the page has
        // scrolled, when real content is passing underneath and the bar needs
        // to stay legible.
        onLandingPage
          ? scrolled
            ? "bg-white/70 supports-[backdrop-filter]:bg-white/55"
            : "bg-transparent"
          : "bg-white/90 supports-[backdrop-filter]:bg-white/75",
        // Kept as a transparent border rather than toggling `border-b`, so the
        // bar does not change height by a pixel when the line appears.
        "border-b",
        scrolled
          ? onLandingPage
            ? "border-[#0463ce]/10"
            : "border-slate-200/80"
          : "border-transparent"
      )}
    >
      <div className="flex h-14 items-center gap-2 pr-4 pl-3 md:h-16 md:pl-4">
        <div className="flex cursor-default items-center">
          <Image
            src="/paypal_logo.png"
            alt="PayPal"
            width={90}
            height={24}
            className="h-auto w-[76px] md:w-[90px]"
            priority
          />
        </div>
        <MainNav className="mx-4 md:mx-6" />
        <div className="ml-auto flex items-center">
          <UserNav />
        </div>
      </div>
    </div>
  );
}
