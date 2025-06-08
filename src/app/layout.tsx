import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Image from "next/image";
import { Suspense } from "react";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import { UserNav } from "@/components/UserNav";
import { UserProvider } from "./UserContext";

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
            <div className="flex-col md:flex">
              <div className="border-b">
                <div className="flex items-center pr-4 pl-1">
                  <div className="flex px-1 pt-1 items-center cursor-default">
                    <Image
                      src="/paypal_logo.png"
                      alt="paypal icon"
                      width={90}
                      height={45}
                    />
                    {/* <span className="font-bold text-lg">Events</span> */}
                  </div>
                  <div className="ml-auto flex items-center">
                    <UserNav />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col h-full">{children}</div>
            <Toaster />
          </UserProvider>
        </body>
      </Suspense>
    </html>
  );
}
