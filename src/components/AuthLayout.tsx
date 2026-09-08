import type { ReactNode } from "react";
import { PageTransition } from "@/components/PageTransition";

/**
 * Shared frame for the sign-in and sign-up screens.
 *
 * From `lg` up it is a two-column split: an illustration panel on the left and
 * the form on the right. Below `lg` the panel is not rendered at all and the
 * form column carries exactly the classes the pages used before, so the phone
 * layout is unchanged rather than merely similar.
 *
 * The panel's own gradient sits behind the artwork so the column is never bare
 * while the SVG loads, and matches the colours the illustration ends on.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    // The header sits above this, so at lg the split is sized to the window
    // minus the header — its 4rem height plus the 1px bottom border, or the
    // page scrolls by exactly that pixel. Below lg the wrapper keeps `min-h-svh` exactly as the pages had
    // it, so nothing about the phone layout moves.
    <PageTransition className="flex min-h-svh w-full lg:min-h-[calc(100svh-4rem-1px)]">
      {/* Decorative only — the form beside it carries all the meaning, so this
          is hidden from screen readers rather than given alt text. */}
      <div
        aria-hidden
        className="relative hidden overflow-hidden bg-gradient-to-b from-[#eaf2ff] via-[#dbe8fb] to-[#c5dbf8] lg:block lg:w-1/2"
      >
        {/* `object-cover` on a full-height box is what makes the artwork scale
            with the window and crop from its edges, rather than letterboxing
            or squashing, at any width or height the column ends up. */}
        <img
          src="/illustrations/events-login.svg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <div className="flex min-h-svh w-full justify-center p-6 md:p-10 lg:min-h-0 lg:w-1/2 lg:items-center">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </PageTransition>
  );
}
