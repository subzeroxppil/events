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
    <div data-site-header className="flex-col md:flex">
      <div className="">
        <div className="flex items-center pr-4 pl-1">
          <div className="flex px-1 pt-1 items-center cursor-default">
            <Image
              src="/paypal_logo.png"
              alt="paypal icon"
              width={90}
              height={45}
            />
          </div>
          <MainNav className="mx-6" />
          <div className="ml-auto flex items-center">
            <UserNav />
          </div>
        </div>
      </div>
    </div>
  );
}
