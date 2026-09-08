"use client";
import { useEffect, useState } from "react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { DraggableCardDemo } from "@/components/DraggableCard";
import { PointerHighlight } from "@/components/ui/pointer-highlight";
import { Button } from "@/components/ui/button";
import { LogIn, QrCode, BarChart3, Gift } from "lucide-react";
import Link from "next/link";
import { Features } from "@/components/Features";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The stat strip under the hero. Each figure is small enough to read at a
 * glance; the check-in count is the only live one, the rest are labels for
 * what the product does.
 */
const CAPABILITIES = [
  { icon: QrCode, label: "QR check-in" },
  { icon: BarChart3, label: "Attendance analytics" },
  { icon: Gift, label: "Lucky draw" },
];

export default function Page() {
  const [checkinsLoading, setCheckinsLoading] = useState(true);
  const [totalCheckins, setTotalCheckins] = useState(0);

  /**
   * Glides to the features rather than jumping. Done in JS rather than with
   * `scroll-behavior: smooth` in CSS so it stays scoped to this one button —
   * a global smooth scroll would also animate anchor jumps and any
   * programmatic scrolling elsewhere in the app.
   *
   * Honours `prefers-reduced-motion`: for anyone who has asked for less
   * movement, a long glide is the thing they asked not to have.
   */
  const scrollToFeatures = () => {
    const target = document.getElementById("features");
    if (!target) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    target.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
  };

  useEffect(() => {
    const fetchCheckins = async () => {
      try {
        setCheckinsLoading(true);
        const response = await fetch("/api/stats/checkins");
        if (response.ok) {
          const data = await response.json();
          setTotalCheckins(data.totalCheckins);
        } else {
          console.error("Failed to fetch check-ins");
        }
      } catch (error) {
        // The counter is a flourish, not the point of the page — a failure
        // leaves it at zero and everything else keeps working.
        console.error("Error fetching check-ins:", error);
      } finally {
        setCheckinsLoading(false);
      }
    };

    fetchCheckins();
  }, []);

  return (
    <main className="relative w-full">
      {/* A wash of the app's own blue, so the landing page and the product read
          as one thing rather than two.

          It starts above the page, behind the sticky header — the header is
          transparent on this page, so the single gradient runs from the very
          top of the window through the hero without a seam. Painting it only
          below the header, as it was, left the bar reading as a separate band
          of flat colour sitting on top of a gradient that began again beneath
          it. The offset matches the header's height (h-14, md:h-16). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-14 -z-10 h-[38rem] bg-gradient-to-b from-[#eaf2ff] via-[#f6f9ff] to-transparent md:-top-16"
      />

      {/* Hero */}
      <section className="relative">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-5 pt-14 pb-10 text-center md:px-8 md:pt-20 md:pb-14">
          <BlurFade delay={0.05} inView>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#0463ce]/20 bg-white/70 px-3 py-1 text-xs font-medium text-[#0463ce] backdrop-blur md:text-sm">
              Events Portal
            </span>
          </BlurFade>

          <BlurFade delay={0.1} inView>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-[#173066] sm:text-5xl md:text-6xl">
              Manage events
              <PointerHighlight
                rectangleClassName="bg-[#e3efff] border-[#0463ce]/30 leading-loose"
                pointerClassName="text-[#0463ce] h-3 w-3"
                containerClassName="inline-block ml-2"
              >
                <span className="relative z-10">smartly</span>
              </PointerHighlight>
              .
            </h1>
          </BlurFade>

          <BlurFade delay={0.15} inView>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">
              Check attendees in by QR code, understand who actually turned up,
              and run a lucky draw the whole room can watch from their phones.
            </p>
          </BlurFade>

          <BlurFade delay={0.2} inView>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <Link href="/admin" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full bg-[#0463ce] px-7 text-white hover:bg-[#0353ab] sm:w-auto"
                >
                  <LogIn />
                  <span>Let&apos;s get started</span>
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                onClick={scrollToFeatures}
                className="w-full border-[#0463ce]/25 px-7 text-[#173066] hover:bg-[#eaf2ff] sm:w-auto"
              >
                See what it does
              </Button>
            </div>
          </BlurFade>

          {/* Live check-in count, presented as a supporting stat rather than
              as the biggest thing on the page. */}
          <BlurFade delay={0.25} inView>
            <div className="mt-10 flex flex-col items-center gap-1">
              {checkinsLoading ? (
                <Skeleton className="h-11 w-32 bg-[#0463ce]/10 md:h-14 md:w-40" />
              ) : (
                <NumberTicker
                  value={totalCheckins}
                  startValue={Math.max(0, totalCheckins - 110)}
                  className="whitespace-pre-wrap text-4xl font-bold tracking-tight text-[#0463ce] md:text-5xl"
                />
              )}
              <span className="text-sm font-medium text-slate-500 md:text-base">
                check-ins and counting
              </span>
            </div>
          </BlurFade>

          <BlurFade delay={0.3} inView>
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              {CAPABILITIES.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-2 text-sm text-slate-600"
                >
                  <Icon className="h-4 w-4 text-[#509bff]" />
                  {label}
                </li>
              ))}
            </ul>
          </BlurFade>
        </div>
      </section>

      {/* Past events — a toy, so it sits below the pitch rather than above it. */}
      <section className="mx-auto w-full max-w-5xl px-5 md:px-8">
        {/* The cards are absolutely positioned and rotated, so they can reach
            the bottom edge of their box — the caption sits outside it rather
            than being crowded by whichever card hangs lowest. */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
          <DraggableCardDemo />
        </div>
        <p className="mt-3 text-center text-sm text-slate-500">
          Psst… drag the cards around to see past events.
        </p>
      </section>

      <Features />

      {/* A closing band rather than letting the last feature card butt against
          the bottom of the window — the page needs somewhere to end. */}
      <footer className="border-t border-slate-200/80 bg-[#f7faff]">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-5 py-12 text-center md:px-8 md:py-16">
          <h2 className="text-xl font-semibold text-[#173066] md:text-2xl">
            Ready to run your next event?
          </h2>
          <p className="max-w-md text-sm text-slate-600 md:text-base">
            Set up an event, share the check-in QR code, and you&apos;re live.
          </p>
          <Link href="/admin">
            <Button
              size="lg"
              className="bg-[#0463ce] px-7 text-white hover:bg-[#0353ab]"
            >
              <LogIn />
              <span>Go to the admin portal</span>
            </Button>
          </Link>
          <p className="mt-4 text-xs text-slate-400">
            PayPal Events Portal · Singapore Development Centre
          </p>
        </div>
      </footer>
    </main>
  );
}
