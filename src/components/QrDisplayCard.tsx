"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Image from "next/image";
import BackButton from "@/components/BackButton";

interface QrDisplayCardProps {
  title: string;
  qrLink: string;
  headingText: string;
  animationData: object;
  animationClassName?: string;
}

export const QrDisplayCard = ({
  title,
  qrLink,
  headingText,
  animationData,
  animationClassName = "h-[100px]",
}: QrDisplayCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(qrLink);
    setCopied(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <BackButton className="self-start" />
      <Card className="p-10 pb-15 bg-[#f8f8f8] border-0 shadow-none">
        <div className="flex flex-col items-center text-center">
          <div className="flex flex-col md:flex-row items-center">
            <span className="text-[60px] font-bold">{headingText}</span>
          </div>
          <Card className="p-10 mt-2 flex flex-col items-center bg-white">
            <div className="flex flex-col gap-1 items-center">
              <Image
                src="/paypal_logo.png"
                width={80}
                height={45}
                alt="paypal icon"
              />
              <span className="font-bold text-2xl max-w-md break-words whitespace-normal mt-1">
                {title}
              </span>
            </div>
            <QRCodeSVG value={qrLink} size={300} />
            {/* Matches the share sheet: the URL sits on one line at the copy
                button's height, ellipsised rather than wrapping. Held to the
                QR code's width so the two line up. */}
            <div className="flex w-full max-w-[300px] items-center gap-1">
              <div className="flex h-9 min-w-0 flex-1 items-center rounded-md bg-muted px-3 text-sm">
                <span className="truncate">{qrLink}</span>
              </div>
              <Button
                variant="secondary"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? <Check /> : <Copy />}
              </Button>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
};
