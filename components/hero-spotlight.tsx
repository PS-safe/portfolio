"use client";

import { useRef, type ReactNode } from "react";

/**
 * HeroSpotlight wraps a hero element and tracks the cursor inside it,
 * exposing the position as `--mx` and `--my` CSS variables. The actual
 * gradient lives in globals.css (.hero-spotlight .hero-text) so styling
 * stays in one place.
 *
 * Children should include an element with class `hero-text` — typically the
 * H1 — which gets the radial accent fill clipped to its glyphs.
 */
export function HeroSpotlight({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  function onMove(e: React.MouseEvent<HTMLSpanElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    // Park the spotlight back at the centre so the gradient is balanced
    // again when the user moves the cursor away.
    el.style.setProperty("--mx", "50%");
    el.style.setProperty("--my", "50%");
  }

  return (
    <span
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`hero-spotlight ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
