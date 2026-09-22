import type { ReactNode } from "react";

export function Tile({
  children,
  className = "",
  padding = "p-6",
}: {
  children: ReactNode;
  className?: string;
  padding?: string;
}) {
  return (
    <div
      className={`border-border bg-surface hover:border-accent-primary/30 rounded-2xl border ${padding} transition-colors duration-150 ${className}`}
    >
      {children}
    </div>
  );
}
