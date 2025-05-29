import type { Metadata } from "next";
import "./globals.css";

import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import Image from "next/image";
import { Suspense } from "react";
import localFont from "next/font/local";
import { Inter } from "next/font/google";

const paypalOpen = localFont({
  src: "../fonts/PayPalOpen-Regular.woff2",
});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Impact Day",
  description: "Welcome to Paypal Impact Day 2025!",
  icons: {
    icon: "/paypal_logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      // className={`h-full ${paypalOpen.className}`}
      className={`h-full ${inter.className}`}
    >
      <body className="flex flex-col">
        <div className="flex-col md:flex">
          <div className="border-b">
            <div className="flex items-center pr-4 pl-2">
              <Link className="flex px-1 py-2 items-center" href="/">
                <Image
                  src="/impact_day_logo.png"
                  alt="paypal icon"
                  width={90}
                  height={60}
                />
              </Link>
            </div>
          </div>
        </div>
        <div className="flex flex-col h-full">
          <Suspense>{children}</Suspense>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
