"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { LoaderPinwheel } from "lucide-react";
import { CircleUser } from "lucide-react";
import { ShieldUser } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex w-full justify-center p-6 md:p-10 h-full">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-4">
          <Card className="mx-auto w-full max-w-sm p-6">
            <div className="flex flex-col items-center text-center">
              <Image
                src="/paypal_logo.png"
                width={60}
                height={60}
                alt="paypal icon"
              />
              <p className="mb-2 text-2xl font-bold">PayPal Impact Day 2025</p>
              <div className="w-full flex flex-col gap-2 mt-4">
                <Link href="/checkin">
                  <Button size={"lg"} className="w-full" variant="outline">
                    <CircleUser />
                    <span>Registration</span>
                  </Button>
                </Link>
                <Link href="/luckydraw">
                  <Button size={"lg"} className="w-full" variant="outline">
                    <LoaderPinwheel />
                    <span>Lucky Draw</span>
                  </Button>
                </Link>
                <Link href="/admin">
                  <Button size={"lg"} className="w-full" variant="outline">
                    <ShieldUser />
                    <span>Admin portal</span>
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
