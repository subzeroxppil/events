"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Image from "next/image";
import Lottie from "lottie-react";

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
      <Card className="p-10 pb-15 bg-[#f8f8f8] border-0 shadow-none">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center">
            <Lottie
              animationData={animationData}
              className={animationClassName}
            />
            <span className="text-[60px] font-bold">{headingText}</span>
          </div>
          <Card className="p-10 mt-2 flex flex-col items-center bg-white">
            <div className="flex flex-col gap-1 items-center">
              <Image
                src="/paypal_logo.png"
                width={80}
                height={80}
                alt="paypal icon"
              />
              <span className="font-bold text-2xl max-w-md break-words whitespace-normal mt-1">
                {title}
              </span>
            </div>
            <QRCodeSVG value={qrLink} size={300} />
            <div className="flex items-center gap-1">
              <div className="bg-muted p-2 rounded-md text-sm">{qrLink}</div>
              <Button variant="secondary" onClick={handleCopy}>
                {copied ? <Check /> : <Copy />}
              </Button>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
};
