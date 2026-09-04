import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Suspense } from "react";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import { UserProvider } from "./UserContext";
import { SiteHeader } from "@/components/SiteHeader";

const paypalOpen = localFont({
  src: "../fonts/PayPalOpen-Regular.woff2",
});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PayPal Events",
  description: "Organise PayPal Events, Lucky Draws and Track Attendance!",
  icons: {
    icon: "/paypal_logo.png",
  },
};

/**
 * `viewport-fit=cover` is what makes `env(safe-area-inset-*)` report real
 * values — without it the public draw page's bottom chip sits under the iPhone
 * home indicator, because every inset reads as 0.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
      <Suspense>
        <body className="flex flex-col">
          <UserProvider>
            <SiteHeader />
            <div className="flex flex-col h-full">{children}</div>
            <Toaster />
          </UserProvider>
        </body>
      </Suspense>
    </html>
  );
}
