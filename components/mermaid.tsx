"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "next-themes";

type Props = {
  chart: string;
  /** Optional title rendered above the diagram. */
  caption?: string;
};

/**
 * Lazy-loaded mermaid renderer. The mermaid bundle (~600kb) only loads on
 * project pages that actually embed a diagram. Re-renders when the theme
 * flips so the diagram color scheme follows the page.
 */
export function Mermaid({ chart, caption }: Props) {
  // mermaid uses this as a DOM id and a CSS selector; useId() is not
  // guaranteed to be selector-safe, so strip everything but [a-zA-Z0-9].
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: resolvedTheme === "dark" ? "dark" : "default",
          themeVariables: {
            primaryColor: resolvedTheme === "dark" ? "#1e3a8a" : "#dbeafe",
            primaryTextColor: resolvedTheme === "dark" ? "#fafafa" : "#0a0a0a",
            primaryBorderColor: resolvedTheme === "dark" ? "#60a5fa" : "#2563eb",
            lineColor: resolvedTheme === "dark" ? "#52525b" : "#a1a1aa",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
            fontSize: "13px",
          },
          securityLevel: "strict",
        });
        const { svg } = await mermaid.render(`mmd-${id}`, chart);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to render diagram");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, id, resolvedTheme]);

  return (
    <figure className="not-prose my-6 rounded-lg border border-border bg-card p-5">
      {caption && (
        <figcaption className="mb-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          {caption}
        </figcaption>
      )}
      {error ? (
        <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs text-red-500">
          {error}
        </pre>
      ) : (
        <div
          ref={containerRef}
          className="flex justify-center overflow-x-auto [&_svg]:max-w-full [&_svg]:h-auto"
          aria-label={caption ?? "Architecture diagram"}
        />
      )}
    </figure>
  );
}
