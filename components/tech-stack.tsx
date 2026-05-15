type Props = {
  label: string;
  items: string[];
};

/**
 * TechStack renders a small labeled row of hoverable tech "chips". Used in
 * the about page MDX to replace the plain "**Languages:** Go · TS · …" lines
 * with something a reader can scan and interact with.
 */
export function TechStack({ label, items }: Props) {
  return (
    <div className="not-prose my-4 flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="min-w-[6.5rem] font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((t) => (
          <span key={t} className="tech-chip">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
