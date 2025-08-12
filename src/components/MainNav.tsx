"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  if (!pathname.startsWith("/admin")) {
    return null;
  }
  console.log("pathname", pathname);
  return (
    <nav
      className={cn(
        "flex items-center space-x-4 lg:space-x-6 h-full justify-center",
        className
      )}
      {...props}
    >
      <Link
        href="/admin"
        className={cn(
          "text-md font-medium transition-colors",
          pathname === "/admin"
            ? "text-black font-bold"
            : "text-muted-foreground hover:text-black"
        )}
      >
        Events
      </Link>
      <Link
        href="/admin/luckydraw"
        className={cn(
          "text-md font-medium transition-colors",
          pathname === "/admin/luckydraw"
            ? "text-black font-bold"
            : "text-muted-foreground hover:text-black"
        )}
      >
        Lucky Draw
      </Link>
    </nav>
  );
}
