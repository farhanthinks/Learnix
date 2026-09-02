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
      className={`border-border bg-surface rounded-2xl border ${padding} hover:bg-surface-raised shadow-black/20 transition-[background-color,box-shadow] duration-150 ease-out hover:shadow-lg ${className}`}
    >
      {children}
    </div>
  );
}
