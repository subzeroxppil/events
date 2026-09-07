"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { MainNav } from "@/components/MainNav";
import { UserNav } from "@/components/UserNav";

export function SiteHeader() {
  const pathname = usePathname();

  // The public view-only draw page is watched full-screen on phones — the logo
  // bar would eat scarce vertical space there.
  if (pathname.startsWith("/live")) return null;

  return (
    // The draw screens fill the window and hide this by the attribute — see
    // `.live-page-host` in globals.css.
    //
    // Sticky and translucent rather than a flat white band: content scrolling
    // under a blurred bar reads as depth, and the hairline border is what
    // separates the bar from the page instead of leaving them the same slab
    // of white.
    <div
      data-site-header
      className="sticky top-0 z-50 w-full border-b border-[#0463ce]/10 bg-[#eaf2ff]/85 backdrop-blur-md supports-[backdrop-filter]:bg-[#eaf2ff]/70"
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
