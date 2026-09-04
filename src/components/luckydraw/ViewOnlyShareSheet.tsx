"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Check, Copy, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface ViewOnlyShareSheetProps {
  luckydrawId: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  /** Replaces the trigger's classes, for skins with their own button style. */
  triggerClassName?: string;
  /** Inline styles for the trigger, for palettes that aren't in Tailwind. */
  triggerStyle?: React.CSSProperties;
}

export default function ViewOnlyShareSheet({
  luckydrawId,
  enabled,
  onEnabledChange,
  triggerClassName,
  triggerStyle,
}: ViewOnlyShareSheetProps) {
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Built on the client so it uses the host the admin actually reached this
  // page on — at a venue that is often not NEXT_PUBLIC_BASE_URL.
  useEffect(() => {
    const origin =
      process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    setUrl(`${origin.replace(/\/$/, "")}/live/${luckydrawId}`);
  }, [luckydrawId]);

  useEffect(() => {
    return () => {
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
    };
  }, []);

  const handleToggle = async (next: boolean) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/luckydraw/${luckydrawId}/viewonly`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });

      if (!res.ok) throw new Error("Failed to update view-only link");

      const data = await res.json();
      onEnabledChange(data.viewOnlyEnabled);
      toast.success(
        data.viewOnlyEnabled
          ? "View-only link is live"
          : "View-only link turned off"
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update view-only link");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
      copyTimeout.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the link");
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className={
            triggerClassName ??
            "backdrop-blur-md bg-white/95 border border-white/70 hover:bg-white text-gray-700 shadow-lg text-xs sm:text-sm"
          }
          style={triggerStyle}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </SheetTrigger>

      <SheetContent className="overflow-y-auto w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            View-only public link
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Let people watch this draw on their own phones — no login needed.
            Useful when there is no big screen at the venue.
          </p>
        </SheetHeader>

        <div className="mt-6 space-y-6 pb-6 px-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <label className="text-sm font-medium">
                Enable view-only link
              </label>
              <div className="text-xs text-muted-foreground mt-0.5">
                While this is off, the link shows nothing at all.
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              {saving && <LoadingSpinner />}
              <Switch
                checked={enabled}
                onCheckedChange={handleToggle}
                disabled={saving}
                aria-label="Enable view-only public link"
              />
            </div>
          </div>

          {enabled && (
            <>
              <Separator />

              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-4 rounded-xl border">
                  <QRCodeSVG value={url} size={256} />
                </div>

                <div className="flex items-center gap-1 w-full">
                  <div className="bg-muted p-2 rounded-md text-sm break-all flex-1">
                    {url}
                  </div>
                  <Button variant="secondary" onClick={handleCopy}>
                    {copied ? <Check /> : <Copy />}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-2">
                <p>
                  Anyone who scans this watches the draw live — the reel spins
                  on their phone the moment you press Spin, with the same
                  sounds and the same winner.
                </p>
                <p>
                  They cannot spin, see the winner history, or change any
                  settings.
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
