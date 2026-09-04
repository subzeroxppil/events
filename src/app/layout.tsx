import type { Metadata } from "next";
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
