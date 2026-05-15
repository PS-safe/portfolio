"use client";

import { useRef, type ReactNode } from "react";

const MAX_DEG = 6;

/**
 * TiltCard wraps a single card and gives it a subtle 3D tilt that follows
 * the cursor. The actual transform lives in the .tilt-card class in
 * globals.css; this component just drives the --tx / --ty custom properties
 * from mouse position. On leave the card snaps back to flat.
 */
export function TiltCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5; // -0.5 .. 0.5
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--tx", `${(-py * MAX_DEG).toFixed(2)}deg`);
    el.style.setProperty("--ty", `${(px * MAX_DEG).toFixed(2)}deg`);
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--tx", "0deg");
    el.style.setProperty("--ty", "0deg");
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`tilt-card ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
