"use client";

import Image from "next/image";
import { useCallback } from "react";
import confetti from "canvas-confetti";
import { Trophy, Ticket, Volume2 } from "lucide-react";

export type WelcomeTone = {
  /** Full-bleed page background. */
  background: string;
  /** Neon colour for the cabinet glow, marquee bulbs and stat tiles. */
  orb: string;
  /** Enter button face. */
  accent: string;
  /** Enter button label colour. */
  accentText: string;
  /** Hard shadow under the Enter button, i.e. the side of the key. */
  accentShadow: string;
  /** Confetti palette for the burst fired when Enter is pressed. */
  confetti: string[];
};

export const DEFAULT_WELCOME_TONE: WelcomeTone = {
  background:
    "radial-gradient(120% 90% at 50% -10%, #1e4fa8 0%, #10265c 45%, #050f2a 100%)",
  orb: "#63cbfb",
  accent: "linear-gradient(180deg, #8addff 0%, #63cbfb 40%, #2f9fe6 100%)",
  accentText: "#04193f",
  accentShadow: "#12588f",
  confetti: ["#63cbfb", "#509bff", "#0463ce", "#ffffff", "#ffd166"],
};

interface LiveWelcomeProps {
  drawName?: string;
  participantCount: number;
  winnerCount: number;
  onEnter: () => void;
  tone?: WelcomeTone;
}

/** Fixed rather than random so the server and client renders agree. */
const SPECKS = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i * 1.3) % 9,
  duration: 9 + ((i * 7) % 8),
  size: 5 + (i % 4) * 2,
  hue: ["#63cbfb", "#509bff", "#ffffff", "#ffd166"][i % 4],
  radius: i % 3 === 0 ? "9999px" : "2px",
}));

const BULBS = Array.from({ length: 9 }, (_, i) => i);

/**
 * First screen of the public view-only page, styled as an arcade cabinet.
 *
 * It exists because mobile browsers will not play audio that no gesture asked
 * for — the Enter key is what unlocks the spin and applause clips. Since a tap
 * is required anyway, it doubles as the welcome: what this page is, how many
 * people are in the draw, and a bit of anticipation.
 */
export default function LiveWelcome({
  drawName,
  participantCount,
  winnerCount,
  onEnter,
  tone = DEFAULT_WELCOME_TONE,
}: LiveWelcomeProps) {
  const handleEnter = useCallback(() => {
    // A small burst so entering feels like the start of something.
    confetti({
      particleCount: 90,
      spread: 75,
      startVelocity: 42,
      ticks: 130,
      origin: { x: 0.5, y: 0.78 },
      colors: tone.confetti,
      disableForReducedMotion: true,
    });
    onEnter();
  }, [onEnter, tone.confetti]);

  const stats = [
    { icon: Ticket, value: participantCount, label: "In the draw" },
    { icon: Trophy, value: winnerCount, label: "Drawn" },
    { icon: Volume2, value: "ON", label: "Sound" },
  ];

  return (
    <div
      className="absolute inset-0 z-50 overflow-hidden"
      style={{ background: tone.background }}
    >
      {/* Cabinet ambience */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      <div
        className="live-orb absolute -top-24 -left-16 w-72 h-72 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${tone.orb}55 0%, transparent 70%)`,
          filter: "blur(20px)",
        }}
      />
      <div
        className="live-orb absolute -bottom-28 -right-20 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${tone.orb}40 0%, transparent 70%)`,
          filter: "blur(24px)",
          animationDelay: "2.5s",
        }}
      />

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {SPECKS.map((c, i) => (
          <span
            key={i}
            className="live-rise absolute bottom-[-10%]"
            style={{
              left: `${c.left}%`,
              width: c.size,
              height: c.size,
              background: c.hue,
              borderRadius: c.radius,
              opacity: 0,
              ["--rise-opacity" as string]: "0.45",
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Scanlines + vignette, so the whole thing reads as a screen */}
      <div className="live-scanlines absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(100% 70% at 50% 50%, transparent 45%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      <div className="relative h-full w-full overflow-y-auto overscroll-contain flex px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        {/* The cabinet. Auto margins rather than `items-center`, so that when it
            outgrows the scroll container its top stays reachable. */}
        <div
          className="live-neon my-auto mx-auto w-full max-w-sm landscape:max-w-3xl rounded-[22px] border border-white/20 overflow-hidden"
          style={{
            ["--neon-1" as string]: `${tone.orb}66`,
            ["--neon-2" as string]: `${tone.orb}55`,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 100%)",
          }}
        >
          {/* Marquee */}
          <div
            className="relative flex items-center justify-center gap-3 px-4 py-2.5 border-b border-white/15"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 100%)",
            }}
          >
            <span className="flex items-center gap-1.5">
              {BULBS.slice(0, 4).map((i) => (
                <Bulb key={i} color={tone.orb} delay={i * 0.18} />
              ))}
            </span>

            <span className="rounded-lg bg-white px-3 py-1.5 shadow-[0_3px_0_rgba(0,0,0,0.3)]">
              <Image
                src="/paypal_logo.png"
                alt="PayPal"
                width={160}
                height={90}
                priority
                className="h-4 sm:h-5 w-auto"
              />
            </span>

            <span className="flex items-center gap-1.5">
              {BULBS.slice(4).map((i) => (
                <Bulb key={i} color={tone.orb} delay={i * 0.18} />
              ))}
            </span>
          </div>

          {/* Screen */}
          <div className="p-5 landscape:p-6 landscape:grid landscape:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] landscape:gap-7 landscape:items-center">
            <div className="text-center landscape:text-left">
              <div className="inline-flex items-center gap-1.5 rounded-md border border-red-400/40 bg-red-500/15 px-2 py-0.5">
                <span className="relative flex items-center justify-center w-2 h-2">
                  <span className="live-dot-ring absolute inset-0 rounded-full bg-red-500" />
                  <span className="live-dot relative w-1.5 h-1.5 rounded-full bg-red-500" />
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-red-200">
                  Live · View only
                </span>
              </div>

              <h1
                className="mt-3 text-[26px] leading-[1.1] sm:text-3xl font-extrabold tracking-tight text-white uppercase text-balance"
                style={{
                  textShadow: `2px 3px 0 rgba(3,10,30,0.55), 0 0 28px ${tone.orb}66`,
                }}
              >
                {drawName || "Lucky Draw"}
              </h1>

              {/* Score panel */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                {stats.map(({ icon: Icon, value, label }) => (
                  <div
                    key={label}
                    className="rounded-lg border border-white/15 bg-black/25 px-1.5 py-2 text-center"
                  >
                    <Icon
                      className="w-3 h-3 mx-auto mb-1"
                      style={{ color: tone.orb }}
                      aria-hidden
                    />
                    <div
                      className="text-base font-extrabold tabular-nums leading-none"
                      style={{ color: tone.orb }}
                    >
                      {value}
                    </div>
                    <div className="mt-1 text-[8px] font-bold uppercase tracking-[0.14em] text-white/50">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 landscape:mt-0 text-center landscape:text-left">
              <p className="text-[13px] sm:text-sm text-white/75 leading-relaxed">
                Every spin lands right here, live. No buttons, no refreshing —
                just watch for your name.
              </p>
              <p className="mt-2 text-sm font-bold text-white">
                Sit back and good luck! 🍀
              </p>

              <button
                type="button"
                onClick={handleEnter}
                className="live-shimmer group relative mt-5 w-full max-w-[20rem] landscape:mx-0 mx-auto block overflow-hidden rounded-xl px-8 py-3.5 text-lg font-extrabold uppercase tracking-[0.12em] border-2 border-white/70 transition-transform duration-100 active:translate-y-[5px] active:shadow-none"
                style={{
                  background: tone.accent,
                  color: tone.accentText,
                  boxShadow: `0 5px 0 ${tone.accentShadow}, 0 12px 26px rgba(0,0,0,0.45)`,
                }}
              >
                <span className="relative z-10">Enter</span>
              </button>

              <p className="live-blink mt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">
                ▸ Volume up · keep this page open ◂
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bulb({ color, delay }: { color: string; delay: number }) {
  return (
    <span
      className="live-marquee-bulb block w-1.5 h-1.5 rounded-full"
      style={{ background: color, color, animationDelay: `${delay}s` }}
    />
  );
}
