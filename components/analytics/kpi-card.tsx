import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function KpiCard({
  icon: Icon,
  iconClassName,
  label,
  value,
  footer,
}: {
  icon: LucideIcon;
  iconClassName: string;
  label: string;
  value: string;
  footer?: ReactNode;
}) {
  return (
    <div className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-5">
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="text-text-secondary text-xs font-medium">{label}</span>
      </div>
      <span className="text-text-primary font-mono text-2xl font-bold">{value}</span>
      {footer}
    </div>
  );
}
