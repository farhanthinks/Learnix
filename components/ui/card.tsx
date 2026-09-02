import { type HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`border-border bg-surface rounded-2xl border p-6 ${className}`} {...props} />
  );
}
