"use client";

import { cn } from "@/lib/utils";
import type { PixelVariant } from "@/components/luckydraw/live/pixel/variants";

/**
 * Shared furniture for the pixel skins.
 *
 * Everything here is deliberately hard-edged: no border radius, no blur, no
 * soft shadows. Colours come from the variant table, which stays on the PayPal
 * ramp throughout.
 */

/** A panel with a chunky double border and a stepped drop shadow. */
export function PixelPanel({
  variant,
  children,
  className,
}: {
  variant: PixelVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("relative", className)}
      style={{
        background: variant.panelFill,
        border: `4px solid ${variant.panelBorder}`,
        boxShadow: `0 0 0 4px ${variant.panelOutline}, 8px 8px 0 0 ${variant.panelShadow}`,
        borderRadius: 0,
      }}
    >
      {children}
    </div>
  );
}

/** Square, blinking "LIVE" tag. */
export function PixelLive({
  variant,
  connected,
}: {
  variant: PixelVariant;
  connected: boolean;
}) {
  const color = connected ? "#ff4d4d" : variant.accent;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 font-pixel text-[8px] leading-none"
      style={{
        background: variant.panelFill,
        border: `2px solid ${color}`,
        color: variant.text,
      }}
    >
      <span
        className="pixel-blink block w-1.5 h-1.5"
        style={{ background: color }}
      />
      {connected ? "LIVE" : "SYNC"}
    </span>
  );
}

/** Scanlines plus a vignette. Skipped by skins that are not meant to be CRTs. */
export function PixelCrt({ variant }: { variant: PixelVariant }) {
  if (!variant.crt) return null;
  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none z-40 opacity-[0.2]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(0,0,0,0.55) 0px, rgba(0,0,0,0.55) 1px, transparent 1px, transparent 3px)",
        }}
      />
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        <div
          className="pixel-scan absolute inset-x-0 h-24"
          style={{
            background:
              "linear-gradient(to bottom, transparent, rgba(99,203,251,0.07), transparent)",
          }}
        />
      </div>
      <div
        className="absolute inset-0 pointer-events-none z-40"
        style={{
          background:
            "radial-gradient(100% 70% at 50% 50%, transparent 45%, rgba(2,6,20,0.72) 100%)",
        }}
      />
    </>
  );
}

/** Deterministic starfield — the same on the server and the client. */
const STARS = Array.from({ length: 46 }, (_, i) => ({
  left: (i * 79) % 100,
  top: (i * 43) % 100,
  size: i % 7 === 0 ? 3 : i % 3 === 0 ? 2 : 1,
  delay: (i % 9) * 0.28,
  color: i % 5 === 0 ? "#ffffff" : i % 3 === 0 ? "#63cbfb" : "#509bff",
}));

/** The variant's background texture. */
export function PixelBackdrop({ variant }: { variant: PixelVariant }) {
  if (variant.backdrop === "stars") {
    return (
      <div className="absolute inset-0 pointer-events-none">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="pixel-twinkle absolute"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              background: s.color,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant.backdrop === "dots") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Clouds and nothing else. The pixel grid, the scrolling tile map and
            the LCD ghosting band that used to sit under them all read as noise
            on a phone rather than as texture, and they were the only things
            competing with the reel for attention. */}
        {LCD_CLOUDS.map((c, i) => (
          <div
            key={i}
            className="pixel-drift absolute"
            style={{
              top: `${c.top}%`,
              animationDuration: `${c.duration}s`,
              animationTimingFunction: `steps(${Math.round(
                c.duration / CLOUD_HOP_SECONDS
              )}, end)`,
              // Negative: start each cloud part-way along, so the sky is
              // populated from the first frame and stays that way.
              animationDelay: `-${(c.duration * c.offset).toFixed(1)}s`,
              ["--cloud-x" as string]: `${c.restX}vw`,
            }}
          >
            <PixelCloud scale={c.scale} />
          </div>
        ))}
      </div>
    );
  }

  if (variant.backdrop === "ghosts" || variant.backdrop === "haunt") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Ghosts where the handheld skin has clouds. Same drift, plus a slow
            bob on an inner element so the two motions compose without either
            fighting the other for the transform. The haunt adds skeletons
            alongside them, on their own slower, heavier rhythm. */}
        {GHOSTS.map((g, i) => (
          <div
            key={i}
            className="pixel-drift absolute"
            style={{
              top: `${g.top}%`,
              animationDuration: `${g.duration}s`,
              animationTimingFunction: `steps(${Math.round(
                g.duration / CLOUD_HOP_SECONDS
              )}, end)`,
              animationDelay: `-${(g.duration * g.offset).toFixed(1)}s`,
              ["--cloud-x" as string]: `${g.restX}vw`,
            }}
          >
            <div
              className="pixel-bob"
              style={{ animationDuration: `${g.bob}s` }}
            >
              <PixelGhost scale={g.scale} fill={variant.backdropTint ?? "#ffffff"} />
            </div>
          </div>
        ))}

        {variant.backdrop === "haunt" &&
          SKELETONS.map((k, i) => (
            <div
              key={`bone-${i}`}
              className="pixel-drift absolute"
              style={{
                top: `${k.top}%`,
                animationDuration: `${k.duration}s`,
                animationTimingFunction: `steps(${Math.round(
                  k.duration / CLOUD_HOP_SECONDS
                )}, end)`,
                animationDelay: `-${(k.duration * k.offset).toFixed(1)}s`,
                ["--cloud-x" as string]: `${k.restX}vw`,
              }}
            >
              <div
                className="pixel-bob"
                style={{ animationDuration: `${k.bob}s` }}
              >
                <PixelSkeleton
                  scale={k.scale}
                  fill={variant.backdropTint ?? "#ffffff"}
                />
              </div>
            </div>
          ))}
      </div>
    );
  }

  if (variant.backdrop === "bats") {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Same drift as the ghosts, but the inner element flutters rather than
            bobs — a quick, uneven flap reads as wings where a slow rise and
            fall reads as floating. */}
        {BATS.map((b, i) => (
          <div
            key={i}
            className="pixel-drift absolute"
            style={{
              top: `${b.top}%`,
              animationDuration: `${b.duration}s`,
              animationTimingFunction: `steps(${Math.round(
                b.duration / CLOUD_HOP_SECONDS
              )}, end)`,
              animationDelay: `-${(b.duration * b.offset).toFixed(1)}s`,
              ["--cloud-x" as string]: `${b.restX}vw`,
            }}
          >
            <div
              className="pixel-flap"
              style={{ animationDuration: `${b.flap}s` }}
            >
              <PixelBat
                scale={b.scale}
                fill={variant.backdropTint ?? "#ffffff"}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Tiled floor.
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.5]"
      style={{
        backgroundImage:
          "repeating-conic-gradient(rgba(99,203,251,0.05) 0% 25%, transparent 0% 50%)",
        backgroundSize: "32px 32px",
      }}
    />
  );
}

/** Four hard corner brackets marking the row that will win. */
export function PixelSelectionFrame({
  variant,
  height,
}: {
  variant: PixelVariant;
  height: number;
}) {
  const arm = "w-3 h-3 absolute";
  const edge = `3px solid ${variant.bracket}`;
  return (
    <div
      className="absolute inset-x-2 top-1/2 -translate-y-1/2 z-30 pointer-events-none"
      style={{ height }}
    >
      <span
        className={`${arm} left-0 top-0`}
        style={{ borderLeft: edge, borderTop: edge }}
      />
      <span
        className={`${arm} right-0 top-0`}
        style={{ borderRight: edge, borderTop: edge }}
      />
      <span
        className={`${arm} left-0 bottom-0`}
        style={{ borderLeft: edge, borderBottom: edge }}
      />
      <span
        className={`${arm} right-0 bottom-0`}
        style={{ borderRight: edge, borderBottom: edge }}
      />
    </div>
  );
}

/** The reel window: chunky frame with a recessed inner edge. */
export function pixelFrameStyle(variant: PixelVariant): React.CSSProperties {
  return {
    background: variant.frameFill,
    border: `4px solid ${variant.frameBorder}`,
    boxShadow: `0 0 0 4px ${variant.frameOutline}, inset 0 0 0 2px ${variant.frameOutline}`,
    borderRadius: 0,
  };
}

/** The one big key on each screen — Enter on the welcome, Spin on admin. */
export function pixelButtonStyle(variant: PixelVariant): React.CSSProperties {
  return {
    background: variant.buttonBg,
    color: variant.buttonText,
    border: `4px solid ${variant.buttonBorder}`,
    boxShadow: `0 0 0 4px ${variant.buttonOutline}, 6px 6px 0 0 ${variant.buttonShadow}`,
    borderRadius: 0,
  };
}


/**
 * Cloud sprites. Fixed values rather than random ones so the server and client
 * renders agree, but deliberately uneven so the drift never looks marshalled.
 *
 * `offset` is how far through its journey a cloud already is when the page
 * opens, applied as a negative animation-delay. A positive delay would have
 * held each cloud off-screen until its turn came, which is why so few were
 * ever visible — and why the ones that were looked frozen.
 */
const LCD_CLOUDS = [
  { top: 10, scale: 4, duration: 58, offset: 0.05, restX: 14 },
  { top: 26, scale: 2, duration: 82, offset: 0.42, restX: 62 },
  { top: 41, scale: 5, duration: 47, offset: 0.71, restX: 30 },
  { top: 57, scale: 3, duration: 68, offset: 0.23, restX: 74 },
  { top: 72, scale: 2, duration: 91, offset: 0.58, restX: 46 },
  { top: 86, scale: 4, duration: 54, offset: 0.87, restX: 8 },
];

/**
 * Seconds between hops. The clouds keep their slow pace; the steps are just
 * finer, so a cloud visibly moves a pixel or two rather than sitting still for
 * the best part of two seconds and then jumping.
 */
const CLOUD_HOP_SECONDS = 0.7;

/**
 * A cloud drawn on a 12x5 grid, one <rect> per lit pixel — the shape a
 * handheld would have had room for.
 */
const CLOUD_ROWS = [
  "....XXXX....",
  "..XXXXXXXX..",
  ".XXXXXXXXXX.",
  "XXXXXXXXXXXX",
  ".XXXXXXXXXX.",
];

function PixelCloud({ scale }: { scale: number }) {
  return (
    <svg
      width={12 * scale}
      height={5 * scale}
      viewBox="0 0 12 5"
      aria-hidden="true"
      shapeRendering="crispEdges"
      className="block opacity-[0.34]"
    >
      {CLOUD_ROWS.flatMap((row, y) =>
        row.split("").map((cell, x) =>
          cell === "X" ? (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill="#173066"
            />
          ) : null
        )
      )}
    </svg>
  );
}

/**
 * Ghosts for the Halloween skin. Same shape of data as the clouds, plus `bob`
 * — the seconds for one float up and back — kept uneven so they never rise and
 * fall in unison.
 */
const GHOSTS = [
  { top: 12, scale: 5, duration: 61, offset: 0.08, restX: 18, bob: 3.1 },
  { top: 29, scale: 4, duration: 84, offset: 0.44, restX: 58, bob: 4.3 },
  { top: 44, scale: 6, duration: 49, offset: 0.69, restX: 26, bob: 2.6 },
  { top: 60, scale: 4, duration: 71, offset: 0.21, restX: 78, bob: 3.8 },
  { top: 75, scale: 5, duration: 93, offset: 0.55, restX: 42, bob: 3.4 },
  { top: 88, scale: 4, duration: 56, offset: 0.85, restX: 10, bob: 4.7 },
];

/**
 * A ghost on an 8x8 grid, one <rect> per lit pixel. The eyes are gaps rather
 * than dark pixels, so the night sky shows through them and the sprite needs
 * only one colour.
 */
const GHOST_ROWS = [
  "..XXXX..",
  ".XXXXXX.",
  "XXXXXXXX",
  "XX.XX.XX",
  "XXXXXXXX",
  "XXXXXXXX",
  "XXXXXXXX",
  "X.XX.XX.",
];

function PixelGhost({ scale, fill }: { scale: number; fill: string }) {
  return (
    <svg
      width={8 * scale}
      height={8 * scale}
      viewBox="0 0 8 8"
      aria-hidden="true"
      shapeRendering="crispEdges"
      // Pale and faint: a backdrop, not something competing with the reel.
      className="block opacity-[0.26]"
    >
      {GHOST_ROWS.flatMap((row, y) =>
        row.split("").map((cell, x) =>
          cell === "X" ? (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={fill}
            />
          ) : null
        )
      )}
    </svg>
  );
}

/**
 * Bats for the blood-moon skin. `flap` is the seconds for one wing beat, kept
 * short and uneven so a colony never pulses in time.
 */
const BATS = [
  { top: 14, scale: 5, duration: 44, offset: 0.11, restX: 22, flap: 0.5 },
  { top: 27, scale: 4, duration: 63, offset: 0.48, restX: 64, flap: 0.7 },
  { top: 46, scale: 6, duration: 38, offset: 0.72, restX: 30, flap: 0.4 },
  { top: 62, scale: 4, duration: 57, offset: 0.26, restX: 80, flap: 0.6 },
  { top: 77, scale: 5, duration: 71, offset: 0.61, restX: 46, flap: 0.55 },
  { top: 90, scale: 4, duration: 49, offset: 0.88, restX: 12, flap: 0.65 },
];

/**
 * A bat on an 11x5 grid — wings out, ears up, one <rect> per lit pixel. The
 * body needs two solid rows: at one it squashed into a dash under the wing
 * beat and stopped reading as a bat at all.
 */
const BAT_ROWS = [
  "X.........X",
  "XX.X...X.XX",
  "XXXXXXXXXXX",
  "XXXXXXXXXXX",
  ".XX.XXX.XX.",
];

function PixelBat({ scale, fill }: { scale: number; fill: string }) {
  return (
    <svg
      width={11 * scale}
      height={5 * scale}
      viewBox="0 0 11 5"
      aria-hidden="true"
      shapeRendering="crispEdges"
      // Higher than the ghosts': a dark red on near-black starts faint, and
      // this skin's scanlines take another bite out of it.
      className="block opacity-[0.5]"
    >
      {BAT_ROWS.flatMap((row, y) =>
        row.split("").map((cell, x) =>
          cell === "X" ? (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />
          ) : null
        )
      )}
    </svg>
  );
}

/**
 * Skeletons for the haunt, drifting between the ghosts. Their tops and speeds
 * deliberately avoid the ghosts' rows, so the two never travel as a pair, and
 * they bob more slowly — bones are heavier than bedsheets.
 */
const SKELETONS = [
  { top: 20, scale: 4, duration: 77, offset: 0.30, restX: 38, bob: 5.2 },
  { top: 37, scale: 3, duration: 95, offset: 0.62, restX: 70, bob: 6.1 },
  { top: 54, scale: 4, duration: 66, offset: 0.15, restX: 12, bob: 4.8 },
  { top: 82, scale: 3, duration: 88, offset: 0.77, restX: 54, bob: 5.6 },
];

/**
 * A skeleton on a 7x9 grid. The eye sockets are gaps in the skull rather than
 * dark pixels, the same trick the ghost uses, so the whole sprite is one
 * colour and reads against any of the night skies.
 */
const SKELETON_ROWS = [
  "..XXX..",
  ".XXXXX.",
  ".X.X.X.",
  ".XXXXX.",
  "..XXX..",
  "XXXXXXX",
  ".XXXXX.",
  "..X.X..",
  "..X.X..",
];

function PixelSkeleton({ scale, fill }: { scale: number; fill: string }) {
  return (
    <svg
      width={7 * scale}
      height={9 * scale}
      viewBox="0 0 7 9"
      aria-hidden="true"
      shapeRendering="crispEdges"
      className="block opacity-[0.26]"
    >
      {SKELETON_ROWS.flatMap((row, y) =>
        row.split("").map((cell, x) =>
          cell === "X" ? (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />
          ) : null
        )
      )}
    </svg>
  );
}
