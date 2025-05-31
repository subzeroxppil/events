"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  CalendarPlus,
  Check,
  CircleAlert,
  CircleHelp,
  Copy,
  Info,
  LogIn,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/DateTimePicker";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import checkinAnimation from "@/app/assets/checkin-animation.json";
import Lottie from "lottie-react";
import { QRCodeSVG } from "qrcode.react";

export default function Page() {
  const params = useParams();
  const eventId = Array.isArray(params?.eventId)
    ? params.eventId[0]
    : params.eventId;

  const [copied, setCopied] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  // const [eventTitle, setEventTitle] = useState(
  //   "Impact Day WheelChair Building Session"
  // );
  // const [qrLink, setQrLink] = useState("https://example.com/page-to-share");
  const [initialLoading, setInitialLoading] = useState(true);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(qrLink);
    setCopied(true);
  };

  const qrLink = `${process.env.NEXT_PUBLIC_BASE_URL}/checkin/${eventId}`;

  useEffect(() => {
    if (!eventId) return;

    const fetchEvent = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/events/${eventId}/checkinqr`
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch event data");
        }

        setEventTitle(data.name);
      } catch (err) {
        console.error(err);
        setEventTitle("Unknown Event");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  return (
    <div className="flex w-full justify-center p-4 h-full">
      {initialLoading ? (
        <LoadingSpinner className="mt-5" />
      ) : (
        <div className="flex flex-col gap-4">
          <Card className="p-10 pb-15 bg-[#f8f8f8] border-0 shadow-none">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center">
                <Lottie
                  animationData={checkinAnimation}
                  className="h-[100px]"
                />
                <span className="text-[60px] font-bold">
                  Welcome! Scan to check in
                </span>
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
                    {eventTitle}
                  </span>
                </div>
                <QRCodeSVG value={qrLink} size={300} />
                <div className="flex items-center gap-1">
                  <div className="bg-muted p-2 rounded-md text-sm">
                    {qrLink}
                  </div>
                  <Button variant="secondary" onClick={handleCopy}>
                    {copied ? <Check /> : <Copy />}
                  </Button>
                </div>
              </Card>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
